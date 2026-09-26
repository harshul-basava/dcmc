"use server";

import { redirect } from "next/navigation";
import { requireParticipant } from "@/server/auth";
import { getSessions, saveFeedback } from "@/server/data";
import { personLookup } from "@/server/people";
import {
  MAX_ONE_TO_ONE_PICKS,
  REPEATABLE_FORMS,
  feedbackForm,
  feedbackFormOpen,
  markFormCompleted,
} from "@/server/feedback";

/**
 * Saves one feedback submission. Everything is re-validated here against the
 * same schema the page rendered from — a closed form, or a missing required
 * answer, is refused server-side regardless of what the browser sent.
 */
export async function submitFeedback(formData: FormData) {
  const me = await requireParticipant("feedback");

  const key = String(formData.get("form") ?? "");
  const form = feedbackForm(key);
  if (!form) redirect("/dashboard/feedback");
  if (!(await feedbackFormOpen(key))) redirect("/dashboard/feedback");

  const sessions = await getSessions();
  // Mirrors the page: only the overall form rates individual sessions.
  const rated =
    key === "overall"
      ? sessions.filter((s) => ["talk", "panel", "workshop"].includes(s.type))
      : [];

  const sessionFeedback = rated.map((session) => {
    const raw = formData.get(`rating-${session.id}`);
    const rating = raw === null || raw === "" ? null : Number(raw);
    return {
      sessionId: session.id,
      // Stored alongside the id so old responses stay legible if a session is
      // renamed later.
      title: session.title,
      rating: Number.isFinite(rating) ? rating : null,
      comment: String(formData.get(`comment-${session.id}`) ?? "").slice(0, 4000),
    };
  });

  // Anonymous responses are stored with no identity attached at all, rather
  // than merely hidden in the admin view.
  const anonymous = formData.get("anonymous") === "on";

  const answers: Record<string, string> = {};
  const ratings: Record<string, number> = {};
  for (const [name, value] of formData.entries()) {
    if (typeof value !== "string") continue;
    if (name.startsWith("rating-") || name.startsWith("comment-")) continue;
    if (name === "form" || name === "anonymous") continue;
    if (name.startsWith("scale-")) {
      const n = Number(value);
      if (Number.isFinite(n)) ratings[name.slice(6)] = n;
      continue;
    }
    answers[name] = value.slice(0, 8000);
  }

  // The daily forms rank people for the next day's pairing round. The picker
  // sends person keys, one per line; with JavaScript off the same field is a
  // textarea of typed names. Both are kept as written — an unmatched name is
  // still an answer, and the pairing round can reconcile it later.
  const daily = key === "friday" || key === "saturday";
  if (daily) {
    const people = await personLookup();
    const picks = String(formData.get("one-on-one-picks") ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, MAX_ONE_TO_ONE_PICKS)
      // The picker sends person keys; resolve them to names so the stored
      // answer is readable. A name typed into the no-JavaScript textarea is
      // already a name and passes through untouched.
      .map((entry, index) => `${index + 1}. ${people.get(entry)?.name ?? entry}`);
    answers["one-on-one-picks"] = picks.join("\n");
  }

  // Each form's own required fields, re-checked here rather than trusted from
  // the browser.
  const REQUIRED: Record<string, string[]> = {
    anytime: ["comment"],
    goals: [
      "goal-outcome",
      "goal-actions",
      "goal-obstacles",
      "goal-blockers",
      "goal-questions",
    ],
    "one-on-ones": ["one-on-ones-overall"],
    friday: ["learned", "one-on-one-picks"],
    saturday: ["learned", "one-on-one-picks"],
  };
  // Anytime is embedded on the index; the rest have their own page.
  const back = key === "anytime" ? "/dashboard/feedback" : `/dashboard/feedback/${key}`;

  for (const field of REQUIRED[key] ?? ["learned"]) {
    if (!answers[field]?.trim()) redirect(`${back}?error=1`);
  }

  // The day rating is a required question too, and it arrives as a rating
  // rather than an answer, so the loop above would never see it.
  if (daily && !Number.isFinite(ratings.day)) redirect(`${back}?error=1`);

  await saveFeedback({
    form: key,
    participantId: anonymous ? "" : me.id,
    participantName: anonymous ? "" : me.name,
    date: form.day,
    sessions: sessionFeedback,
    answers,
    ratings,
    submittedAt: new Date().toISOString(),
  });

  // Repeatable forms never get a completion tick.
  if (!REPEATABLE_FORMS.has(key)) await markFormCompleted(me.id, key);

  redirect(`${back}?saved=1`);
}
