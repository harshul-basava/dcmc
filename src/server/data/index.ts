/**
 * The one place the dashboard talks to its data.
 *
 * Today every function reads the fixture arrays in `./fixtures`. When the real
 * Airtable base exists, these bodies become REST calls (plus the two-tier read
 * cache the source dashboard uses: a long TTL for directories, a short one for
 * schedules and the signed-in person's own record) and no page needs to change.
 *
 * Writes mutate the fixture arrays in place. That is honestly non-durable — a
 * server restart loses them — but it exercises the same code paths the real
 * writes will use.
 */

import { safeEqual } from "../session";
import {
  FIELD,
  SESSION_FIELD,
  SETTING_FIELD,
  airtableConfigured,
  attachmentUrl,
  count,
  createSessionRecord,
  deleteSessionRecord,
  fetchRoster,
  fetchSessions,
  fetchSettings,
  incrementSignIns,
  patchRecord,
  patchSessionRecord,
  putSetting,
  setSignIns,
  text,
  uploadHeadshot,
  type AirtableRecord,
} from "../airtable";
import type {
  Assignment,
  ConversationPreference,
  FeedbackResponse,
  Guest,
  Participant,
  PersonKey,
  PortalPageSetting,
  Role,
  Session,
} from "./types";
import { PAIRING_EXCLUDED, isSessionType } from "./types";
import * as fixtures from "./fixtures";

export * from "./types";

/** Shortest phrase we will look up, matching the source dashboard's floor. */
const MIN_SHORT_PASSWORD_LENGTH = 6;
export const MAX_PASSWORD_LENGTH = 256;

/** `"Soft Fog"`, `"soft-fog"` and `"softfog"` are all the same phrase. */
export function shortPasswordKey(value: string): string {
  return value.toLowerCase().replace(/[\s-]/g, "");
}

/** One Admit Confirmation row as the dashboard sees it. */
function toParticipant(record: AirtableRecord): Participant {
  const f = record.fields;
  const first = text(f[FIELD.firstName]);
  const last = text(f[FIELD.lastName]);
  const affiliation = text(f[FIELD.affiliation]);

  return {
    id: record.id,
    name: [first, last].filter(Boolean).join(" ") || "Unnamed attendee",
    // Admit Confirmation carries no role; the card omits the line when empty.
    title: "",
    organization: affiliation,
    school: affiliation,
    photo: attachmentUrl(f[FIELD.headshot]),
    bio: text(f[FIELD.bio]),
    linkedin: text(f[FIELD.linkedin]) || undefined,
    email: text(f[FIELD.email]),
    shortPassword: text(f[FIELD.signInPhrase]),
    accessCount: count(f[FIELD.signIns]),
    interests: [],
  };
}

export async function getParticipants(): Promise<Participant[]> {
  if (!airtableConfigured()) return fixtures.participants;
  const records = await fetchRoster();
  return records
    .map(toParticipant)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getGuests(): Promise<Guest[]> {
  return fixtures.guests;
}

export async function getParticipant(id: string): Promise<Participant | null> {
  if (!airtableConfigured()) return fixtures.participants.find((p) => p.id === id) ?? null;
  return (await getParticipants()).find((p) => p.id === id) ?? null;
}

export async function getGuest(id: string): Promise<Guest | null> {
  return fixtures.guests.find((g) => g.id === id) ?? null;
}

/** Airtable returns UTC; the programme is written and read in DC local time. */
const CONFERENCE_TZ = process.env.CONFERENCE_TIMEZONE ?? "America/New_York";

/** `2026-10-23T08:00` in conference-local time, from an ISO instant. */
function toLocalISO(value: unknown): string {
  if (typeof value !== "string" || !value) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CONFERENCE_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

const PERSONALIZED_TYPES = new Set(["one-to-one", "small-group"]);

function toSession(record: AirtableRecord): Session {
  const f = record.fields;
  const start = toLocalISO(f[SESSION_FIELD.start]);
  const rawType = text(f[SESSION_FIELD.type]);
  const type = isSessionType(rawType) ? rawType : "talk";
  const slido = text(f[SESSION_FIELD.slido]);

  return {
    id: record.id,
    title: text(f[SESSION_FIELD.event]) || "Untitled event",
    // Derived, never stored, so the day and the start time cannot disagree.
    day: start.slice(0, 10),
    start,
    end: toLocalISO(f[SESSION_FIELD.end]),
    type,
    track: text(f[SESSION_FIELD.track]),
    status: text(f[SESSION_FIELD.status]) === "tentative" ? "tentative" : "confirmed",
    location: text(f[SESSION_FIELD.location]),
    speaker: text(f[SESSION_FIELD.speakers]),
    slidoUrl: slido || undefined,
    description: text(f[SESSION_FIELD.details]),
    personalized: PERSONALIZED_TYPES.has(type),
  };
}

export async function getSessions(): Promise<Session[]> {
  if (!airtableConfigured()) {
    return [...fixtures.sessions].sort((a, b) => a.start.localeCompare(b.start));
  }
  return (await fetchSessions())
    .map(toSession)
    .filter((session) => session.start && session.end)
    .sort((a, b) => a.start.localeCompare(b.start));
}

export async function getSession(id: string): Promise<Session | null> {
  if (!airtableConfigured()) return fixtures.sessions.find((s) => s.id === id) ?? null;
  return (await getSessions()).find((s) => s.id === id) ?? null;
}

export async function getAssignments(): Promise<Assignment[]> {
  return fixtures.assignments;
}

/**
 * Only published rows, and never the exclusion sentinels — this is what a
 * participant or guest is allowed to see about their own schedule.
 */
export async function getPublishedAssignmentsFor(personKey: PersonKey): Promise<Assignment[]> {
  return fixtures.assignments.filter(
    (a) => a.personKey === personKey && a.state === "published" && a.group !== PAIRING_EXCLUDED,
  );
}

/** Everyone sharing a group in a session, used to name a person's 1:1 partner. */
export async function getGroupMembers(sessionId: string, group: string): Promise<Assignment[]> {
  return fixtures.assignments.filter(
    (a) => a.sessionId === sessionId && a.group === group && a.state === "published",
  );
}

export async function getPreferences(): Promise<ConversationPreference[]> {
  return fixtures.preferences;
}

export type PasswordMatch = { role: Exclude<Role, "admin">; id: string };

/**
 * Looks a sign-in phrase up across both rosters.
 *
 * Returns null when nothing matches *and* when the phrase matches in both
 * rosters: an ambiguous credential is refused rather than resolved, so two
 * people can never share one phrase and land in each other's account.
 */
export async function findPersonByPassword(password: string): Promise<PasswordMatch | null> {
  const key = shortPasswordKey(password);
  if (key.length < MIN_SHORT_PASSWORD_LENGTH) return null;

  const matches: PasswordMatch[] = [];

  for (const person of await getParticipants()) {
    if (person.shortPassword && safeEqual(key, shortPasswordKey(person.shortPassword))) {
      matches.push({ role: "participant", id: person.id });
    }
  }

  for (const person of airtableConfigured() ? [] : fixtures.participants) {
    if (safeEqual(key, shortPasswordKey(person.shortPassword))) {
      matches.push({ role: "participant", id: person.id });
    }
  }
  for (const person of fixtures.guests) {
    if (safeEqual(key, shortPasswordKey(person.shortPassword))) {
      matches.push({ role: "guest", id: person.id });
    }
  }
  return matches.length === 1 ? matches[0] : null;
}

/**
 * Bumps the sign-in counter shown on the admin people page. Deliberately
 * fail-open: a counter that cannot be written must never block a login.
 */
export async function recordLogin(match: PasswordMatch): Promise<void> {
  if (airtableConfigured() && match.role === "participant") {
    await incrementSignIns(match.id);
    return;
  }

  const list: { id: string; accessCount: number }[] =
    match.role === "participant" ? fixtures.participants : fixtures.guests;
  const person = list.find((p) => p.id === match.id);
  if (person) person.accessCount += 1;
}

export async function setAccessCount(role: Exclude<Role, "admin">, id: string, value: number): Promise<void> {
  if (airtableConfigured() && role === "participant") {
    await setSignIns(id, value);
    return;
  }

  const list: { id: string; accessCount: number }[] =
    role === "participant" ? fixtures.participants : fixtures.guests;
  const person = list.find((p) => p.id === id);
  if (person) person.accessCount = Math.max(0, value);
}

export async function getPortalPageSettings(): Promise<PortalPageSetting[]> {
  if (!airtableConfigured()) return fixtures.portalPageSettings;

  return (await fetchSettings()).map((record) => ({
    id: record.id,
    audience: text(record.fields[SETTING_FIELD.audience]) as PortalPageSetting["audience"],
    key: text(record.fields[SETTING_FIELD.key]),
    label: text(record.fields[SETTING_FIELD.label]),
    enabled: record.fields[SETTING_FIELD.enabled] === true,
  }));
}

/** Upserts one setting row, keyed by audience + page key. */
export async function savePortalPageSetting(
  audience: PortalPageSetting["audience"],
  key: string,
  label: string,
  enabled: boolean,
): Promise<void> {
  if (airtableConfigured()) {
    await putSetting(audience, key, label, enabled);
    return;
  }

  const existing = fixtures.portalPageSettings.find((s) => s.audience === audience && s.key === key);
  if (existing) {
    existing.enabled = enabled;
    existing.label = label;
    return;
  }
  fixtures.portalPageSettings.push({
    id: `rec${`SET${fixtures.portalPageSettings.length + 1}`.padEnd(14, "X").slice(0, 14)}`,
    audience,
    key,
    label,
    enabled,
  });
}

/** Local `YYYY-MM-DDTHH:MM` to an instant Airtable will store correctly. */
function toAirtableInstant(local: string): string {
  // Interpreting the wall time in the conference's zone, offset and all.
  const asUTC = new Date(`${local}:00Z`);
  const shown = new Date(asUTC.toLocaleString("en-US", { timeZone: CONFERENCE_TZ }));
  const reference = new Date(asUTC.toLocaleString("en-US", { timeZone: "UTC" }));
  return new Date(asUTC.getTime() + (reference.getTime() - shown.getTime())).toISOString();
}

export async function saveSession(id: string | null, fields: Omit<Session, "id" | "day">): Promise<Session> {
  // The day is always derived from the start time, never entered separately,
  // so the two can't drift.
  const day = fields.start.slice(0, 10);

  if (airtableConfigured()) {
    const payload = {
      [SESSION_FIELD.event]: fields.title,
      [SESSION_FIELD.start]: toAirtableInstant(fields.start),
      [SESSION_FIELD.end]: toAirtableInstant(fields.end),
      [SESSION_FIELD.type]: fields.type,
      [SESSION_FIELD.track]: fields.track,
      [SESSION_FIELD.status]: fields.status,
      [SESSION_FIELD.location]: fields.location,
      [SESSION_FIELD.slido]: fields.slidoUrl ?? "",
      [SESSION_FIELD.speakers]: fields.speaker,
      [SESSION_FIELD.details]: fields.description,
    };
    if (id) await patchSessionRecord(id, payload);
    else await createSessionRecord(payload);
    return { id: id ?? "", ...fields, day };
  }

  if (id) {
    const existing = fixtures.sessions.find((s) => s.id === id);
    if (!existing) throw new Error(`No session ${id}`);
    Object.assign(existing, fields, { day });
    return existing;
  }
  const created: Session = {
    id: `rec${`S${fixtures.sessions.length + 1}`.padEnd(14, "X").slice(0, 14)}`,
    ...fields,
    day,
  };
  fixtures.sessions.push(created);
  return created;
}

export async function deleteSession(id: string): Promise<void> {
  if (airtableConfigured()) {
    await deleteSessionRecord(id);
    return;
  }

  const index = fixtures.sessions.findIndex((s) => s.id === id);
  if (index >= 0) fixtures.sessions.splice(index, 1);
}

/**
 * Replaces every row for these sessions in one state with a new set. Rows are
 * added before the old ones are dropped, so a failure part-way cannot leave a
 * session with no assignments at all.
 */
export async function replaceAssignments(
  sessionIds: string[],
  rows: Omit<Assignment, "id" | "state">[],
  state: Assignment["state"],
): Promise<void> {
  const ids = new Set(sessionIds);
  const added = rows.map((row, i) => ({
    id: `rec${`A${Date.now() % 100000}${i}`.padEnd(14, "X").slice(0, 14)}`,
    ...row,
    state,
  }));
  fixtures.assignments.push(...added);
  const keep = fixtures.assignments.filter(
    (a) =>
      !added.includes(a) &&
      // Exclusion markers are working state; regeneration must not clear them.
      !(ids.has(a.sessionId) && a.state === state && a.group !== PAIRING_EXCLUDED),
  );
  fixtures.assignments.length = 0;
  fixtures.assignments.push(...keep, ...added);
}

export async function getFeedback(): Promise<FeedbackResponse[]> {
  return fixtures.feedbackResponses;
}

export async function saveFeedback(response: Omit<FeedbackResponse, "id">): Promise<void> {
  const key = `${response.form}:${response.participantId}`;
  const existing = fixtures.feedbackResponses.find(
    (r) => `${r.form}:${r.participantId}` === key && r.form !== "anytime",
  );
  if (existing) {
    Object.assign(existing, response);
    return;
  }
  fixtures.feedbackResponses.push({
    id: `rec${`F${fixtures.feedbackResponses.length + 1}`.padEnd(14, "X").slice(0, 14)}`,
    ...response,
  });
}

export type ProfileEdit = {
  firstName: string;
  lastName: string;
  bio: string;
  linkedin: string;
};

/** Saves the fields an attendee may edit about themselves. */
export async function saveProfile(id: string, edit: ProfileEdit): Promise<void> {
  if (!airtableConfigured()) {
    const person = fixtures.participants.find((p) => p.id === id);
    if (person) {
      person.name = [edit.firstName, edit.lastName].filter(Boolean).join(" ");
      person.bio = edit.bio;
      person.linkedin = edit.linkedin || undefined;
    }
    return;
  }

  await patchRecord(id, {
    [FIELD.firstName]: edit.firstName,
    [FIELD.lastName]: edit.lastName,
    [FIELD.bio]: edit.bio,
    [FIELD.linkedin]: edit.linkedin,
  });
}

export async function saveHeadshot(
  id: string,
  file: { buffer: Buffer; contentType: string; filename: string },
): Promise<void> {
  if (!airtableConfigured()) return;
  await uploadHeadshot(id, file);
}

export async function saveBio(role: Exclude<Role, "admin">, id: string, bio: string): Promise<void> {
  const list: { id: string; bio: string }[] =
    role === "participant" ? fixtures.participants : fixtures.guests;
  const person = list.find((p) => p.id === id);
  if (person) person.bio = bio.slice(0, 4000);
}

export async function saveAvailability(id: string, csv: string): Promise<void> {
  const guest = fixtures.guests.find((g) => g.id === id);
  if (guest) guest.availability = csv;
}
