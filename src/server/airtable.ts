/**
 * Airtable REST client for the attendee roster.
 *
 * The roster lives in the "Admit Confirmation" table: one row per person who
 * confirmed they are coming. Field ids rather than names are used throughout,
 * so renaming a column in Airtable does not break the dashboard.
 *
 * Every id can be overridden by environment variable, which is how a future
 * conference points the same code at a different base.
 */

const API = "https://api.airtable.com/v0";
const TIMEOUT_MS = 8000;

export const ATTENDEE_TABLE = process.env.AIRTABLE_ATTENDEES_TABLE ?? "tblENlEdorcKZlnar";

/** Admit Confirmation columns. */
export const FIELD = {
  firstName: process.env.AIRTABLE_FIELD_FIRST_NAME ?? "fldMBMe1YIQ9xeJCL",
  lastName: process.env.AIRTABLE_FIELD_LAST_NAME ?? "fldxKn0lGUCfNGjYY",
  email: process.env.AIRTABLE_FIELD_EMAIL ?? "fld0Ox8PqrOt0UQwJ",
  attending: process.env.AIRTABLE_FIELD_ATTENDING ?? "fld8JFXahP30HZm5D",
  headshot: process.env.AIRTABLE_FIELD_HEADSHOT ?? "fldxWTsys0s3Mafbs",
  affiliation: process.env.AIRTABLE_FIELD_AFFILIATION ?? "fld4lIEue3sklKgcx",
  bio: process.env.AIRTABLE_FIELD_BIO ?? "fldi2fIeXBpWRrGGl",
  linkedin: process.env.AIRTABLE_FIELD_LINKEDIN ?? "fldaDmvl7WNX9Xn4R",
  signInPhrase: process.env.AIRTABLE_FIELD_SIGN_IN_PHRASE ?? "fld2tj16YxBDQ2F69",
  signIns: process.env.AIRTABLE_FIELD_SIGN_INS ?? "fldxN8WdBe7KbE6eN",
} as const;

/** Sessions: the programme. */
export const SESSIONS_TABLE = process.env.AIRTABLE_SESSIONS_TABLE ?? "tbl57pO8M6sdoRwMF";

export const SESSION_FIELD = {
  event: process.env.AIRTABLE_FIELD_EVENT ?? "fldIGm1wpTifacaLi",
  start: process.env.AIRTABLE_FIELD_START ?? "fldhHMPOA0rn3KxQE",
  end: process.env.AIRTABLE_FIELD_END ?? "fldwdPxxJh1yO6kK6",
  type: process.env.AIRTABLE_FIELD_TYPE ?? "fldhoSP7alrdfYt0g",
  track: process.env.AIRTABLE_FIELD_TRACK ?? "fldACn1nph6ARg4cU",
  status: process.env.AIRTABLE_FIELD_STATUS ?? "fld2Qv72Tm5T7Q9e6",
  location: process.env.AIRTABLE_FIELD_LOCATION ?? "fldrlYn8NT4r5VOLo",
  slido: process.env.AIRTABLE_FIELD_SLIDO ?? "fldlWe4opONWJiJj3",
  speakers: process.env.AIRTABLE_FIELD_SPEAKERS ?? "fldo1drv6qdpJVJgk",
  details: process.env.AIRTABLE_FIELD_DETAILS ?? "fldocNtQ1lEeUW8sE",
} as const;

/** DCMC 2.0 Speakers and Guests: the guest RSVP table.
 *  Its primary column is named "Question" — an artefact of the intake form,
 *  where the first question asked for the person's name. It holds the name. */
export const GUEST_TABLE = process.env.AIRTABLE_GUESTS_TABLE ?? "tblduvKvg50k6bOE6";

export const GUEST_FIELD = {
  name: process.env.AIRTABLE_FIELD_GUEST_NAME ?? "fldcdd7c4sN2lT51A",
  email: process.env.AIRTABLE_FIELD_GUEST_EMAIL ?? "fldIzMMK9zU3FsCvu",
  rsvp: process.env.AIRTABLE_FIELD_GUEST_RSVP ?? "fldgomIPLGdoTZzKc",
  dates: process.env.AIRTABLE_FIELD_GUEST_DATES ?? "fldZdbDZaBFvlj908",
  /** Free text from the RSVP form. Read-only; the portal never writes it. */
  times: process.env.AIRTABLE_FIELD_GUEST_TIMES ?? "fld4ZcBt0FzASYk1R",
  /** `date,start,end` rows written by the portal's availability editor. */
  availability: process.env.AIRTABLE_FIELD_GUEST_AVAILABILITY ?? "fldYIV6bEegcbZ9DH",
  role: process.env.AIRTABLE_FIELD_GUEST_ROLE ?? "fldf04BCVQnlIVPvU",
  affiliation: process.env.AIRTABLE_FIELD_GUEST_AFFILIATION ?? "fldzmQSGiSTlwvNyc",
  bio: process.env.AIRTABLE_FIELD_GUEST_BIO ?? "fldeJPcrW8Ckdib5l",
  headshot: process.env.AIRTABLE_FIELD_GUEST_HEADSHOT ?? "fldqUSVDUMRvOo9bs",
  linkedin: process.env.AIRTABLE_FIELD_GUEST_LINKEDIN ?? "fldfEjImCbqeUCbwf",
  signInPhrase: process.env.AIRTABLE_FIELD_GUEST_PHRASE ?? "fldgjaHKO2ZS9122R",
  signIns: process.env.AIRTABLE_FIELD_GUEST_SIGN_INS ?? "fldhBgkqn6ipeNe1u",
} as const;

/** The affirmative choice on the guest RSVP question. */
const GUEST_RSVP_YES = process.env.AIRTABLE_GUEST_RSVP_YES ?? "Yes";

/** Portal Feedback: everything submitted through the feedback forms. */
export const FEEDBACK_TABLE = process.env.AIRTABLE_FEEDBACK_TABLE ?? "tblVVWszzKTEI4rmE";

export const FEEDBACK_FIELD = {
  reference: process.env.AIRTABLE_FIELD_FB_REFERENCE ?? "fldPABZTuddX2AmfL",
  form: process.env.AIRTABLE_FIELD_FB_FORM ?? "fldrJ0J3NdP14AA48",
  attendee: process.env.AIRTABLE_FIELD_FB_ATTENDEE ?? "fldY7f4ZdryLk9dWe",
  attendeeId: process.env.AIRTABLE_FIELD_FB_ATTENDEE_ID ?? "fldaSPY6LOVkUDl4R",
  day: process.env.AIRTABLE_FIELD_FB_DAY ?? "fldOowedqX4Yp53tL",
  dayRating: process.env.AIRTABLE_FIELD_FB_DAY_RATING ?? "fldLru97e4PyGtX5g",
  requests: process.env.AIRTABLE_FIELD_FB_REQUESTS ?? "fldK40J9PibkJtcAf",
  answers: process.env.AIRTABLE_FIELD_FB_ANSWERS ?? "fldFN6wjCrhDHQTqJ",
  ratings: process.env.AIRTABLE_FIELD_FB_RATINGS ?? "fldkdCFDZSJu8IUbx",
  sessionRatings: process.env.AIRTABLE_FIELD_FB_SESSIONS ?? "flda7BDw61L9QLBQf",
  submittedAt: process.env.AIRTABLE_FIELD_FB_SUBMITTED ?? "flde5vtxB7C49fLaD",
} as const;

/** Portal Page Settings: which pages each audience can open. */
export const SETTINGS_TABLE = process.env.AIRTABLE_SETTINGS_TABLE ?? "tblhmi9HvNpiwh8Dm";

export const SETTING_FIELD = {
  setting: process.env.AIRTABLE_FIELD_SETTING ?? "fld5bLtm3BuSYv5Kh",
  audience: process.env.AIRTABLE_FIELD_AUDIENCE ?? "fldJMcNoHb8UtODSC",
  key: process.env.AIRTABLE_FIELD_SETTING_KEY ?? "fldt8EH6hbZqvDJsl",
  label: process.env.AIRTABLE_FIELD_SETTING_LABEL ?? "fldwJ9bII3DGmy068",
  enabled: process.env.AIRTABLE_FIELD_ENABLED ?? "fld8j0dKW8XKMWCGe",
} as const;

/** The "Yes, I can commit…" choice on the attending question. */
const ATTENDING_YES =
  process.env.AIRTABLE_ATTENDING_YES ??
  "Yes, I can commit to attending for the entire duration of the conference.";

export type AirtableAttachment = { id: string; url: string; filename: string };

export type AirtableRecord = {
  id: string;
  fields: Record<string, unknown>;
};

function config(): { token: string; baseId: string } | null {
  const token = process.env.AIRTABLE_API_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!token || !baseId) return null;
  return { token, baseId };
}

/** Whether the dashboard should read live data rather than fixtures. */
export function airtableConfigured(): boolean {
  return config() !== null;
}

async function request(path: string, init: RequestInit = {}): Promise<unknown> {
  const cfg = config();
  if (!cfg) throw new Error("Airtable is not configured");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${API}/${cfg.baseId}/${path}`, {
      ...init,
      signal: controller.signal,
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        "Content-Type": "application/json",
        ...init.headers,
      },
    });
    if (!response.ok) {
      // Never echo the body: it can contain record data.
      throw new Error(`Airtable ${init.method ?? "GET"} ${path} failed: ${response.status}`);
    }
    return response.json();
  } finally {
    clearTimeout(timer);
  }
}

/* ---------- Read cache ----------
 * One shared copy of the roster per function instance, refreshed on a short
 * TTL and dropped outright whenever we write. Without this every directory
 * render would be a round trip to Airtable.
 */

const TTL_MS = Number(process.env.AIRTABLE_CACHE_TTL_SECONDS ?? 60) * 1000;
let cache: { at: number; records: AirtableRecord[] } | null = null;
let inFlight: Promise<AirtableRecord[]> | null = null;

export function invalidateRoster(): void {
  cache = null;
}

/** Everyone who confirmed they are attending. */
export async function fetchRoster(): Promise<AirtableRecord[]> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.records;
  // Collapse concurrent misses into one request.
  if (inFlight) return inFlight;

  inFlight = (async () => {
    const records: AirtableRecord[] = [];
    let offset: string | undefined;

    do {
      const params = new URLSearchParams({
        pageSize: "100",
        filterByFormula: `{${FIELD.attending}} = "${ATTENDING_YES.replace(/"/g, '\\"')}"`,
        returnFieldsByFieldId: "true",
      });
      if (offset) params.set("offset", offset);

      const page = (await request(`${ATTENDEE_TABLE}?${params}`)) as {
        records: AirtableRecord[];
        offset?: string;
      };
      records.push(...page.records);
      offset = page.offset;
    } while (offset);

    cache = { at: Date.now(), records };
    return records;
  })();

  try {
    return await inFlight;
  } catch (error) {
    // A failed refresh keeps serving the previous copy rather than emptying
    // the directory; only a cold cache surfaces the error.
    if (cache) return cache.records;
    throw error;
  } finally {
    inFlight = null;
  }
}

export async function fetchRecord(
  recordId: string,
  table: string = ATTENDEE_TABLE,
): Promise<AirtableRecord> {
  return (await request(
    `${table}/${recordId}?returnFieldsByFieldId=true`,
  )) as AirtableRecord;
}

export async function patchRecord(
  recordId: string,
  fields: Record<string, unknown>,
  table: string = ATTENDEE_TABLE,
): Promise<void> {
  await request(`${table}/${recordId}`, {
    method: "PATCH",
    body: JSON.stringify({ fields, returnFieldsByFieldId: true }),
  });
  if (table === GUEST_TABLE) invalidateGuests();
  else invalidateRoster();
}

/** Airtable's own cap on the upload endpoint. */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/**
 * Replaces the headshot. Uses Airtable's upload endpoint, which takes the file
 * inline as base64 — so no second storage service and no public URL needed.
 * Note this host differs from the REST API's.
 */
export async function uploadHeadshot(
  recordId: string,
  file: { buffer: Buffer; contentType: string; filename: string },
  table: string = ATTENDEE_TABLE,
): Promise<void> {
  const cfg = config();
  if (!cfg) throw new Error("Airtable is not configured");
  if (file.buffer.byteLength > MAX_UPLOAD_BYTES) {
    throw new Error("Headshot is larger than 5MB");
  }

  const fieldId = table === GUEST_TABLE ? GUEST_FIELD.headshot : FIELD.headshot;
  const response = await fetch(
    `https://content.airtable.com/v0/${cfg.baseId}/${recordId}/${fieldId}/uploadAttachment`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contentType: file.contentType,
        file: file.buffer.toString("base64"),
        filename: file.filename,
      }),
    },
  );

  if (!response.ok) throw new Error(`Headshot upload failed: ${response.status}`);
  if (table === GUEST_TABLE) invalidateGuests();
  else invalidateRoster();
}

/** First attachment URL, if any. Airtable's URLs are short-lived by design. */
export function attachmentUrl(value: unknown): string | undefined {
  if (!Array.isArray(value) || value.length === 0) return undefined;
  const first = value[0] as Partial<AirtableAttachment>;
  return typeof first?.url === "string" ? first.url : undefined;
}

export function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function count(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

/* ---------- Portal page settings ----------
 * Cached like the roster, and for the same reason: these are read on every
 * page render to build the navigation.
 */

let settingsCache: { at: number; records: AirtableRecord[] } | null = null;

export function invalidateSettings(): void {
  settingsCache = null;
}

export async function fetchSettings(): Promise<AirtableRecord[]> {
  if (settingsCache && Date.now() - settingsCache.at < TTL_MS) return settingsCache.records;

  try {
    const page = (await request(
      `${SETTINGS_TABLE}?pageSize=100&returnFieldsByFieldId=true`,
    )) as { records: AirtableRecord[] };
    settingsCache = { at: Date.now(), records: page.records };
    return page.records;
  } catch (error) {
    if (settingsCache) return settingsCache.records;
    throw error;
  }
}

/**
 * Upserts one setting. Matched on audience + key rather than record id, so the
 * dashboard never has to remember which row it wrote last time.
 */
export async function putSetting(
  audience: string,
  key: string,
  label: string,
  enabled: boolean,
): Promise<void> {
  const fields = {
    [SETTING_FIELD.setting]: `${audience}:${key}`,
    [SETTING_FIELD.audience]: audience,
    [SETTING_FIELD.key]: key,
    [SETTING_FIELD.label]: label,
    [SETTING_FIELD.enabled]: enabled,
  };

  const existing = (await fetchSettings()).find(
    (record) =>
      text(record.fields[SETTING_FIELD.audience]) === audience &&
      text(record.fields[SETTING_FIELD.key]) === key,
  );

  if (existing) {
    await request(`${SETTINGS_TABLE}/${existing.id}`, {
      method: "PATCH",
      body: JSON.stringify({ fields }),
    });
  } else {
    await request(SETTINGS_TABLE, {
      method: "POST",
      body: JSON.stringify({ records: [{ fields }] }),
    });
  }

  invalidateSettings();
}

/* ---------- Sessions ---------- */

let sessionsCache: { at: number; records: AirtableRecord[] } | null = null;

export function invalidateSessions(): void {
  sessionsCache = null;
}

export async function fetchSessions(): Promise<AirtableRecord[]> {
  if (sessionsCache && Date.now() - sessionsCache.at < TTL_MS) return sessionsCache.records;

  try {
    const records: AirtableRecord[] = [];
    let offset: string | undefined;
    do {
      const params = new URLSearchParams({ pageSize: "100", returnFieldsByFieldId: "true" });
      if (offset) params.set("offset", offset);
      const page = (await request(`${SESSIONS_TABLE}?${params}`)) as {
        records: AirtableRecord[];
        offset?: string;
      };
      records.push(...page.records);
      offset = page.offset;
    } while (offset);

    sessionsCache = { at: Date.now(), records };
    return records;
  } catch (error) {
    if (sessionsCache) return sessionsCache.records;
    throw error;
  }
}

export async function createSessionRecord(fields: Record<string, unknown>): Promise<void> {
  await request(SESSIONS_TABLE, {
    method: "POST",
    body: JSON.stringify({ records: [{ fields }], typecast: true }),
  });
  invalidateSessions();
}

export async function patchSessionRecord(
  recordId: string,
  fields: Record<string, unknown>,
): Promise<void> {
  await request(`${SESSIONS_TABLE}/${recordId}`, {
    method: "PATCH",
    body: JSON.stringify({ fields, typecast: true }),
  });
  invalidateSessions();
}

export async function deleteSessionRecord(recordId: string): Promise<void> {
  await request(`${SESSIONS_TABLE}/${recordId}`, { method: "DELETE" });
  invalidateSessions();
}

/** Bumps the sign-in counter. Read-then-write; a lost race costs one count. */
export async function incrementSignIns(recordId: string): Promise<void> {
  const record = await fetchRecord(recordId);
  await patchRecord(recordId, { [FIELD.signIns]: count(record.fields[FIELD.signIns]) + 1 });
}

export async function setSignIns(recordId: string, value: number): Promise<void> {
  await patchRecord(recordId, { [FIELD.signIns]: Math.max(0, value) });
}

/* ---------- Guests ---------- */

let guestsCache: { at: number; records: AirtableRecord[] } | null = null;

export function invalidateGuests(): void {
  guestsCache = null;
}

/** Every speaker or guest who said yes. */
export async function fetchGuests(): Promise<AirtableRecord[]> {
  if (guestsCache && Date.now() - guestsCache.at < TTL_MS) return guestsCache.records;

  try {
    const records: AirtableRecord[] = [];
    let offset: string | undefined;
    do {
      const params = new URLSearchParams({
        pageSize: "100",
        filterByFormula: `{${GUEST_FIELD.rsvp}} = "${GUEST_RSVP_YES.replace(/"/g, '\\"')}"`,
        returnFieldsByFieldId: "true",
      });
      if (offset) params.set("offset", offset);
      const page = (await request(`${GUEST_TABLE}?${params}`)) as {
        records: AirtableRecord[];
        offset?: string;
      };
      records.push(...page.records);
      offset = page.offset;
    } while (offset);

    guestsCache = { at: Date.now(), records };
    return records;
  } catch (error) {
    if (guestsCache) return guestsCache.records;
    throw error;
  }
}

/* ---------- Feedback ---------- */

let feedbackCache: { at: number; records: AirtableRecord[] } | null = null;

export function invalidateFeedback(): void {
  feedbackCache = null;
}

export async function fetchFeedback(): Promise<AirtableRecord[]> {
  if (feedbackCache && Date.now() - feedbackCache.at < TTL_MS) return feedbackCache.records;

  try {
    const records: AirtableRecord[] = [];
    let offset: string | undefined;
    do {
      const params = new URLSearchParams({ pageSize: "100", returnFieldsByFieldId: "true" });
      if (offset) params.set("offset", offset);
      const page = (await request(`${FEEDBACK_TABLE}?${params}`)) as {
        records: AirtableRecord[];
        offset?: string;
      };
      records.push(...page.records);
      offset = page.offset;
    } while (offset);

    feedbackCache = { at: Date.now(), records };
    return records;
  } catch (error) {
    if (feedbackCache) return feedbackCache.records;
    throw error;
  }
}

export async function createFeedbackRecord(fields: Record<string, unknown>): Promise<void> {
  await request(FEEDBACK_TABLE, {
    method: "POST",
    body: JSON.stringify({ records: [{ fields }], typecast: true }),
  });
  invalidateFeedback();
}

export async function updateFeedbackRecord(
  recordId: string,
  fields: Record<string, unknown>,
): Promise<void> {
  await request(`${FEEDBACK_TABLE}/${recordId}`, {
    method: "PATCH",
    body: JSON.stringify({ fields, typecast: true }),
  });
  invalidateFeedback();
}

export async function incrementGuestSignIns(recordId: string): Promise<void> {
  const record = await fetchRecord(recordId, GUEST_TABLE);
  await patchRecord(
    recordId,
    { [GUEST_FIELD.signIns]: count(record.fields[GUEST_FIELD.signIns]) + 1 },
    GUEST_TABLE,
  );
}

export async function setGuestSignIns(recordId: string, value: number): Promise<void> {
  await patchRecord(recordId, { [GUEST_FIELD.signIns]: Math.max(0, value) }, GUEST_TABLE);
}
