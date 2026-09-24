/**
 * Record shapes for the dashboard.
 *
 * These deliberately mirror the normalized objects the AI risk workshop
 * dashboard builds out of Airtable rows (`assignmentSummary`, `sessionSummary`,
 * `portalSettingSummary` in its `api/dashboard.js`), so that swapping fixtures
 * for a real Airtable base is a change inside `src/server/data/` and nowhere
 * else. Ids use Airtable's `rec` + 14 characters shape for the same reason.
 */

export type Role = "participant" | "guest" | "admin";

/**
 * `"participant:recXXX"` / `"guest:recXXX"`. Assignments are keyed this way so
 * one row can point at either kind of person without two nullable columns.
 */
export type PersonKey = `participant:${string}` | `guest:${string}`;

export type Person = {
  id: string;
  name: string;
  /** Shown under the name in directories. */
  title: string;
  organization: string;
  /** 4:5 headshot under /public. Absent falls back to a monogram plate. */
  photo?: string;
  bio: string;
  linkedin?: string;
  /** Never rendered in any participant-facing view. */
  email: string;
  /** Two-word sign-in phrase, e.g. "soft-fog". Never rendered outside admin. */
  shortPassword: string;
  /** Successful sign-ins. Admin-only; incremented on login. */
  accessCount: number;
};

export type Participant = Person & {
  school: string;
  /** Course of study / focus, used as directory filter chips. */
  interests: string[];
};

export type Guest = Person & {
  /** CSV rows of `date,start,end` in local time, as stored in one long-text
   *  Airtable field so it stays hand-editable there. */
  availability: string;
};

/**
 * Drives block colour and which sessions are personalized.
 *
 * A value, not just a type: the editor's dropdown, the legend and the save
 * action all read this one list, and the save action checks against it. The
 * type arrives as an untrusted form string, and it is interpolated into a
 * `--block-<type>` custom property, so it is validated rather than cast.
 */
export const SESSION_TYPES = [
  "talk",
  "panel",
  "workshop",
  "working-session",
  "one-to-one",
  "small-group",
  "meal",
  "social",
  "break",
  "logistics",
] as const;

export type SessionType = (typeof SESSION_TYPES)[number];

export function isSessionType(value: string): value is SessionType {
  return (SESSION_TYPES as readonly string[]).includes(value);
}

export type Session = {
  id: string;
  title: string;
  /** ISO date, `YYYY-MM-DD`. Derived from `start`, never entered by hand. */
  day: string;
  /** ISO local datetime, `YYYY-MM-DDTHH:MM`. */
  start: string;
  end: string;
  type: SessionType;
  track: string;
  status: "confirmed" | "tentative";
  location: string;
  speaker: string;
  /** Q&A link, talks only. Must be https. */
  slidoUrl?: string;
  /** Attendee-facing. */
  description: string;
  /**
   * True when the block means something different per person, so the schedule
   * must join assignments to render it. Set directly, or inferred from a
   * one-to-one / small-group type.
   */
  personalized: boolean;
};

export type Assignment = {
  id: string;
  sessionId: string;
  personKey: PersonKey;
  /** Pair or group label, e.g. `"S1 · 1:1 03"` or `"Group B"`. */
  group: string;
  location: string;
  kind: "1:1" | "Small group";
  /** Draft rows are admin-only; participants see published rows only. */
  state: "draft" | "published";
};

/**
 * A sentinel `group` marking someone excluded from one specific block. Kept as
 * a draft row so exclusions survive regeneration and never reach participants.
 */
export const PAIRING_EXCLUDED = "__PAIRING_EXCLUDED__";

export type ConversationPreference = {
  id: string;
  sourceKey: PersonKey;
  targetKey: PersonKey;
  /** 1 is the strongest preference. */
  rank: number;
};

export type PortalPageSetting = {
  id: string;
  /** `"participant"` / `"guest"`, or `"all"` for settings both roles share. */
  audience: Role | "all";
  key: string;
  label: string;
  enabled: boolean;
};

export type FeedbackResponse = {
  id: string;
  form: string;
  participantId: string;
  participantName: string;
  date: string;
  /** Per-session ratings and comments. */
  sessions: { sessionId: string; title: string; rating: number | null; comment: string }[];
  /** Free-text answers keyed by question name. */
  answers: Record<string, string>;
  /** 0–10 and 1–5 scales keyed by question name. */
  ratings: Record<string, number>;
  submittedAt: string;
};
