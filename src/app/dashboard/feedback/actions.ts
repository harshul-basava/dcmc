"use server";

import { redirect } from "next/navigation";
import { requireParticipant } from "@/server/auth";
import { getSessions, saveFeedback } from "@/server/data";
import {
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
  // Mirrors the page: only the day and overall forms rate sessions.
  const ratesSessions = key === "friday" || key === "saturday" || key === "overall";
  const rated = ratesSessions
    ? form.day
      ? sessions.filter((s) => s.day === form.day && ["talk", "panel", "workshop"].includes(s.type))
      : sessions.filter((s) => ["talk", "panel", "workshop"].includes(s.type))
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
  };
  // Anytime is embedded on the index; the rest have their own page.
  const back = key === "anytime" ? "/dashboard/feedback" : `/dashboard/feedback/${key}`;

  for (const field of REQUIRED[key] ?? ["learned"]) {
    if (!answers[field]?.trim()) redirect(`${back}?error=1`);
  }

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
