import { createHmac, createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import {
  getGroupMembers,
  getPortalPageSettings,
  getPublishedAssignmentsFor,
  getSessions,
} from "./data";
import type { PersonKey } from "./data/types";
import { personLookup } from "./people";
import { formatRange, minutesOf } from "./schedule";

/**
 * Which feedback forms exist, in the order they are offered. Dates are derived
 * from the live schedule rather than hard-coded, so moving the conference does
 * not strand the forms — only the stable keys are fixed.
 */
export const FEEDBACK_FORMS = [
  {
    key: "goals",
    label: "Goal-setting",
    title: "Goal-setting",
    day: "",
    description: "Set your intentions for DCMC 2.0.",
  },
  {
    key: "friday",
    label: "Friday",
    title: "Friday Feedback",
    day: "2026-10-23",
    description: "Daily reflection and Saturday 1:1 requests",
  },
  {
    key: "saturday",
    label: "Saturday",
    title: "Saturday Feedback",
    day: "2026-10-24",
    description: "Daily reflection and Sunday 1:1 requests",
  },
  {
    key: "overall",
    label: "Overall",
    title: "Overall Feedback",
    day: "",
    description: "The conference as a whole",
  },
  {
    key: "one-on-ones",
    label: "One-on-ones",
    title: "One-on-ones",
    day: "",
    description: "Rate your 1-1 conversations",
  },
  {
    key: "anytime",
    label: "Anytime",
    title: "Anytime Feedback",
    day: "",
    description: "Share a comment whenever you want",
  },
] as const;

/**
 * Forms that are open before an admin touches anything: goal-setting, because
 * it is meant to be filled in before arrival, and anytime, which never closes.
 * The rest open as their day arrives.
 */
const OPEN_BY_DEFAULT = new Set(["goals", "anytime"]);

/** Submitted more than once, so they never carry a completion tick. */
export const REPEATABLE_FORMS = new Set(["anytime"]);

export type FeedbackFormKey = (typeof FEEDBACK_FORMS)[number]["key"];

export function feedbackForm(key: string) {
  return FEEDBACK_FORMS.find((form) => form.key === key) ?? null;
}

/**
 * Forms default to closed except `anytime`, which is always open and may be
 * submitted more than once. An admin opens the rest when the day arrives.
 */
export async function feedbackFormOpen(key: string): Promise<boolean> {
  if (key === "anytime") return true;
  const settings = await getPortalPageSettings();
  const stored = settings.find((s) => s.audience === "all" && s.key === `feedback-${key}`);
  return stored?.enabled ?? OPEN_BY_DEFAULT.has(key);
}

export type Conversation = {
  id: string;
  /** Who they actually sat with. */
  partner: string;
  sessionTitle: string;
  day: string;
  timeLabel: string;
};

/**
 * Every published one-on-one this participant had, so the 1-1 form can ask
 * about each by name rather than in the abstract.
 */
export async function oneToOneConversations(participantId: string): Promise<Conversation[]> {
  const key: PersonKey = `participant:${participantId}`;
  const [assignments, sessions, people] = await Promise.all([
    getPublishedAssignmentsFor(key),
    getSessions(),
    personLookup(),
  ]);

  const conversations: Conversation[] = [];

  for (const assignment of assignments) {
    if (assignment.kind !== "1:1") continue;
    const session = sessions.find((s) => s.id === assignment.sessionId);
    if (!session) continue;

    const partner = (await getGroupMembers(assignment.sessionId, assignment.group))
      .filter((member) => member.personKey !== key)
      .map((member) => people.get(member.personKey)?.name)
      .filter(Boolean)
      .join(" and ");
    if (!partner) continue;

    conversations.push({
      id: assignment.id,
      partner,
      sessionTitle: session.title,
      day: new Date(`${session.day}T12:00:00Z`).toLocaleDateString("en-US", {
        weekday: "long",
        timeZone: "UTC",
      }),
      timeLabel: formatRange(minutesOf(session.start), minutesOf(session.end)),
    });
  }

  return conversations;
}

/* ---------- Completion cookie ----------
 * Which forms someone has already submitted is held in its own signed cookie,
 * separate from the session and longer-lived, so the "Completed" badge
 * survives signing out and back in. It is a convenience marker only — the
 * authoritative record is the saved response.
 */

const COMPLETION_COOKIE =
  process.env.NODE_ENV === "production" ? "__Secure-dcmc_feedback" : "dcmc_feedback";
const COMPLETION_TTL_SECONDS = 60 * 60 * 24 * 7;

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function equal(a: string, b: string): boolean {
  return timingSafeEqual(
    createHash("sha256").update(a).digest(),
    createHash("sha256").update(b).digest(),
  );
}

export async function completedForms(participantId: string): Promise<Set<string>> {
  const secret = process.env.DASHBOARD_SESSION_SECRET;
  const store = await cookies();
  const token = store.get(COMPLETION_COOKIE)?.value;
  if (!secret || secret.length < 32 || !token) return new Set();

  const dot = token.indexOf(".");
  if (dot < 1) return new Set();
  const payload = token.slice(0, dot);
  if (!equal(token.slice(dot + 1), sign(payload, secret))) return new Set();

  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    // Bound to one person, so a shared browser can't show someone else's ticks.
    if (claims.participantId !== participantId) return new Set();
    if (Number(claims.expiresAt) <= Date.now()) return new Set();
    return new Set(Array.isArray(claims.forms) ? claims.forms.map(String) : []);
  } catch {
    return new Set();
  }
}

export async function markFormCompleted(participantId: string, form: string): Promise<void> {
  const secret = process.env.DASHBOARD_SESSION_SECRET;
  if (!secret || secret.length < 32) return;

  const forms = new Set(await completedForms(participantId));
  forms.add(form);

  const payload = Buffer.from(
    JSON.stringify({
      participantId,
      forms: [...forms],
      expiresAt: Date.now() + COMPLETION_TTL_SECONDS * 1000,
    }),
  ).toString("base64url");

  const store = await cookies();
  store.set(COMPLETION_COOKIE, `${payload}.${sign(payload, secret)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/dashboard",
    maxAge: COMPLETION_TTL_SECONDS,
  });
}
