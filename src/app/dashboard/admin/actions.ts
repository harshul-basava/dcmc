"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/server/auth";
import {
  deleteSession,
  getAssignments,
  getGuests,
  getParticipants,
  getPreferences,
  getSessions,
  replaceAssignments,
  savePortalPageSetting,
  saveSession,
  setAccessCount,
} from "@/server/data";
import { isSessionType } from "@/server/data/types";
import type { PersonKey } from "@/server/data/types";
import { HANDBOOK_RESOURCES_KEY, PORTAL_PAGES } from "@/server/portal-pages";
import { FEEDBACK_FORMS } from "@/server/feedback";
import { CONFERENCE_DAYS } from "@/server/schedule";
import {
  conversationCounts,
  excludedFrom,
  generateOneToOne,
  generateSmallGroups,
} from "@/server/pairings";

export async function savePortalPages(formData: FormData) {
  await requireAdmin();

  // Every page in the catalogue is written on every save. Reading the checkbox
  // by name means an unchecked box (which browsers omit entirely) correctly
  // becomes `false` rather than being left at its old value.
  for (const page of PORTAL_PAGES) {
    await savePortalPageSetting(
      page.role,
      page.key,
      page.label,
      formData.get(`page-${page.role}:${page.key}`) === "on",
    );
  }

  await savePortalPageSetting(
    "all",
    HANDBOOK_RESOURCES_KEY,
    "Conference resources",
    formData.get(`feature-${HANDBOOK_RESOURCES_KEY}`) === "on",
  );

  revalidatePath("/dashboard", "layout");
  redirect("/dashboard/admin/pages?saved=1");
}

export async function saveFeedbackAvailability(formData: FormData) {
  await requireAdmin();

  for (const form of FEEDBACK_FORMS) {
    if (form.key === "anytime") continue; // Always open, by design.
    await savePortalPageSetting(
      "all",
      `feedback-${form.key}`,
      form.label,
      formData.get(`feedback-${form.key}`) === "on",
    );
  }

  revalidatePath("/dashboard", "layout");
  redirect("/dashboard/admin/feedback?saved=1");
}

/**
 * Carries the schedule page's day filter back through a redirect, so saving
 * an event does not silently drop the days the organizer was focused on.
 * Re-validated here rather than echoed: it is form input landing in a URL.
 */
function scheduleUrl(query: string, formData: FormData): string {
  const raw = String(formData.get("days") ?? "");
  const days = raw
    .split(",")
    .map((day) => day.trim())
    .filter((day) => /^\d{4}-\d{2}-\d{2}$/.test(day));
  const suffix = days.length ? `&days=${days.join(",")}` : "";
  return `/dashboard/admin/schedule?${query}${suffix}`;
}

export async function saveProgramSession(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "") || null;
  const title = String(formData.get("title") ?? "").trim().slice(0, 240);

  // One day plus two clock times, recombined here. Re-checked against the
  // known conference days so a hand-crafted post cannot place an event
  // somewhere the schedule grid would never render it.
  const day = String(formData.get("day") ?? "");
  const startTime = String(formData.get("startTime") ?? "");
  const endTime = String(formData.get("endTime") ?? "");

  const validTime = (value: string) => /^\d{2}:\d{2}$/.test(value);
  if (!title || !CONFERENCE_DAYS.includes(day) || !validTime(startTime) || !validTime(endTime)) {
    redirect(scheduleUrl("error=1", formData));
  }

  const start = `${day}T${startTime}`;
  const end = `${day}T${endTime}`;
  if (end <= start) redirect(scheduleUrl("error=1", formData));

  const slido = String(formData.get("slidoUrl") ?? "").trim();
  // Untrusted, and it ends up in a `--block-<type>` custom property as well
  // as in Airtable, where a write with typecast would mint a junk select
  // option. Anything unrecognised falls back rather than being trusted.
  const rawType = String(formData.get("type") ?? "talk");
  const type = isSessionType(rawType) ? rawType : "talk";

  await saveSession(id, {
    title,
    start,
    end,
    type,
    track: String(formData.get("track") ?? "").slice(0, 100),
    status: formData.get("status") === "tentative" ? "tentative" : "confirmed",
    location: String(formData.get("location") ?? "").slice(0, 240),
    speaker: String(formData.get("speaker") ?? "").slice(0, 240),
    // Only https links are accepted, so a saved link can't downgrade anyone.
    slidoUrl: slido.startsWith("https://") ? slido : undefined,
    description: String(formData.get("description") ?? "").slice(0, 4000),
    personalized: type === "one-to-one" || type === "small-group",
  });

  revalidatePath("/dashboard", "layout");
  redirect(scheduleUrl("saved=1", formData));
}

export async function removeProgramSession(formData: FormData) {
  await requireAdmin();
  await deleteSession(String(formData.get("id") ?? ""));
  revalidatePath("/dashboard", "layout");
  redirect(scheduleUrl("deleted=1", formData));
}

export async function changeAccessCount(formData: FormData) {
  await requireAdmin();

  const role = formData.get("role") === "guest" ? "guest" : "participant";
  const id = String(formData.get("id") ?? "");
  const current = Number(formData.get("current") ?? 0);
  const action = String(formData.get("action") ?? "");

  const next = action === "increment" ? current + 1 : action === "decrement" ? current - 1 : 0;
  await setAccessCount(role, id, next);

  revalidatePath("/dashboard/admin/people");
  redirect("/dashboard/admin/people");
}

/** Roster for one block: everybody not explicitly excluded from it. */
async function rosterFor(sessionId: string): Promise<PersonKey[]> {
  const [participants, guests, assignments] = await Promise.all([
    getParticipants(),
    getGuests(),
    getAssignments(),
  ]);
  const excluded = excludedFrom(assignments, sessionId);

  return [
    ...participants.map((p) => `participant:${p.id}` as PersonKey),
    ...guests.map((g) => `guest:${g.id}` as PersonKey),
  ].filter((key) => !excluded.has(key));
}

export async function generatePairings(formData: FormData) {
  await requireAdmin();

  const sessionId = String(formData.get("sessionId") ?? "");
  const sessions = await getSessions();
  const session = sessions.find((s) => s.id === sessionId);
  if (!session) redirect("/dashboard/admin/pairings?error=1");

  const [roster, preferences, assignments] = await Promise.all([
    rosterFor(sessionId),
    getPreferences(),
    getAssignments(),
  ]);

  const rows =
    session.type === "small-group"
      ? generateSmallGroups({
          sessionId,
          roster,
          size: Number(formData.get("size") ?? 5),
        })
      : generateOneToOne({
          sessionId,
          roster,
          preferences,
          // Spread conversations across the whole conference, not just this block.
          existingCounts: conversationCounts(assignments.filter((a) => a.sessionId !== sessionId)),
        });

  // Generation only ever writes a draft. Publishing is a separate, deliberate act.
  await replaceAssignments([sessionId], rows, "draft");

  revalidatePath("/dashboard", "layout");
  redirect(`/dashboard/admin/pairings?generated=${sessionId}`);
}

export async function publishPairings(formData: FormData) {
  await requireAdmin();

  const sessionId = String(formData.get("sessionId") ?? "");
  const assignments = await getAssignments();
  const draft = assignments
    .filter((a) => a.sessionId === sessionId && a.state === "draft")
    .map(({ sessionId: s, personKey, group, location, kind }) => ({
      sessionId: s,
      personKey,
      group,
      location,
      kind,
    }));

  if (!draft.length) redirect("/dashboard/admin/pairings?error=1");

  await replaceAssignments([sessionId], draft, "published");
  revalidatePath("/dashboard", "layout");
  redirect(`/dashboard/admin/pairings?published=${sessionId}`);
}

/** Withdraws a block from participant schedules, leaving the draft intact. */
export async function hidePairings(formData: FormData) {
  await requireAdmin();
  const sessionId = String(formData.get("sessionId") ?? "");
  await replaceAssignments([sessionId], [], "published");
  revalidatePath("/dashboard", "layout");
  redirect(`/dashboard/admin/pairings?hidden=${sessionId}`);
}
