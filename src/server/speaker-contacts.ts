import "server-only";
import { airtableConfigured, listTableRecords, type AirtableRecord } from "./airtable";

/** Private attendee-sharing data is read at request time, never shipped in Git. */
export type SpeakerContact = {
  name: string;
  organization: string;
  email?: string;
  signal?: { value: string; href?: string };
  shareLinkedin?: boolean;
  slides?: { title: string; href: string; sizeBytes: number };
};

const CONTACTS_TABLE = process.env.AIRTABLE_SPEAKER_CONTACTS_TABLE ?? "tblZJHVRdMlSzvsd8";

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function attachment(record: AirtableRecord) {
  const files = record.fields["Slides"];
  if (!Array.isArray(files)) return null;
  return files.find((file) => {
    if (!file || typeof file.url !== "string" || file.type !== "application/pdf") return false;
    try {
      const url = new URL(file.url);
      return url.protocol === "https:" && url.hostname.endsWith(".airtableusercontent.com");
    } catch { return false; }
  }) as { url: string; size?: number; filename: string } | undefined;
}

/** Reject unknown properties so importing an email or postal details fails closed. */
export function contactFromRecord(record: AirtableRecord): SpeakerContact | null {
  const fields = record.fields;
  if (fields["Approved for attendees"] !== true || typeof fields.Name !== "string") return null;
  let data: Record<string, unknown>;
  try { data = JSON.parse(String(fields["Approved contacts"])); } catch { return null; }
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  if (Object.keys(data).some((key) => !["organization", "email", "signal", "shareLinkedin"].includes(key))) return null;
  if (data.email !== undefined && (typeof data.email !== "string" || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(data.email))) return null;
  const contact: SpeakerContact = {
    name: fields.Name,
    organization: typeof data.organization === "string" ? data.organization : "",
  };
  if (typeof data.email === "string") contact.email = data.email;
  if (data.signal && typeof data.signal === "object" && !Array.isArray(data.signal)) {
    const signal = data.signal as Record<string, unknown>;
    if (Object.keys(signal).some((key) => !["value", "href"].includes(key))) return null;
    if (typeof signal.value !== "string" || !/^[\w.+() -]{1,64}$/.test(signal.value)) return null;
    contact.signal = { value: signal.value };
    if (typeof signal.href === "string" && /^https:\/\/signal\.me\/#p\/\+\d+$/.test(signal.href)) contact.signal.href = signal.href;
  }
  if (!contact.email && !contact.signal) return null;
  if (data.shareLinkedin === true) contact.shareLinkedin = true;
  const pdf = attachment(record);
  // The single approved slide deck currently has its own authenticated route.
  if (slug(contact.name) === "caleb-knapp" && pdf && typeof fields["Slides title"] === "string") {
    contact.slides = {
      title: fields["Slides title"],
      href: "/dashboard/handbook/speaker-contacts/slides/caleb-knapp",
      sizeBytes: pdf.size ?? 0,
    };
  }
  return contact;
}

async function contactRecords() {
  // Fixtures have no real private contacts. Production reads the existing base.
  return airtableConfigured() ? listTableRecords(CONTACTS_TABLE) : [];
}

export async function getSpeakerContacts(): Promise<SpeakerContact[]> {
  return (await contactRecords()).flatMap((record) => {
    const contact = contactFromRecord(record);
    return contact ? [contact] : [];
  }).sort((a, b) => (a.name.split(" ").at(-1) ?? a.name).localeCompare(b.name.split(" ").at(-1) ?? b.name));
}

/** Signed Airtable file URLs stay server-side; browser downloads use our route. */
export async function getSpeakerSlides(speaker: string) {
  for (const record of await contactRecords()) {
    const contact = contactFromRecord(record);
    if (contact?.slides && slug(contact.name) === speaker) return attachment(record) ?? null;
  }
  return null;
}
