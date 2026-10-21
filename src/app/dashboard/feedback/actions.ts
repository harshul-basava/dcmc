"use server";

import { isTestParticipant } from "@/server/test-attendee";
import { redirect } from "next/navigation";
import { isPreviewing, requireParticipant } from "@/server/auth";
import { replacePreferences, saveFeedback } from "@/server/data";
import { getFeedbackQuestions } from "@/server/feedback-questions";
import { readFeedbackOptions } from "@/server/feedback-options";
import { flattenSessionRatingOptions, sessionRatingOptions } from "@/server/session-ratings";
import type { PersonKey } from "@/server/data/types";
import {
  MAX_ONE_TO_ONE_PICKS,
  REPEATABLE_FORMS,
  feedbackForm,
  feedbackFormOpen,
  markFormCompleted,
  oneToOneCandidates,
  normalizePreferenceName,
} from "@/server/feedback";

/**
 * Saves one feedback submission. Everything is re-validated here against the
 * same schema the page rendered from — a closed form, or a missing required
 * answer, is refused server-side regardless of what the browser sent.
 */
export async function submitFeedback(formData: FormData) {
  const me = await requireParticipant("feedback");
  // A signed admin preview may validate a form, but never writes anything.
  const testing = await isPreviewing();
  const liveTest = isTestParticipant(me.id);

  const key = String(formData.get("form") ?? "");
  const form = feedbackForm(key);
  if (!form) redirect("/dashboard/feedback");
  if (!testing && !liveTest && !(await feedbackFormOpen(key))) redirect("/dashboard/feedback");
  const questions = (await getFeedbackQuestions(key)).filter((q) => q.enabled);
  const rankedQuestion = questions.find((q) => q.type === "ranked");
  const showSessionRatings = questions.some((q) => q.type === "sessions");

  // Rebuild the same participant-specific options used by the page. Forged
  // session, facilitator, and conversation ids are never accepted.
  const snapshot = formData.get("session-options");
  const shown = snapshot === null ? null : readFeedbackOptions(snapshot, me.id);
  if (key === "overall" && snapshot !== null && !shown) redirect("/dashboard/feedback/overall?error=options");
  const rated = key === "overall" && showSessionRatings ? (shown ?? await sessionRatingOptions(me.id)) : [];

  const sessionFeedback = flattenSessionRatingOptions(rated).map((session) => {
    const raw = formData.get(`rating-${session.id}`);
    const parsed = raw === null || raw === "" ? null : Number(raw);
    const rating = parsed !== null && Number.isInteger(parsed) && parsed >= 1 && parsed <= 5 ? parsed : null;
    return {
      sessionId: session.id,
      // Stored alongside the id so old responses stay legible if a session is
      // renamed later.
      title: session.title,
      rating,
      comment: String(formData.get(`comment-${session.id}`) ?? "").slice(0, 4000),
    };
  });

  // Anonymous responses are stored with no identity attached at all, rather
  // than merely hidden in the admin view.
  const anonymous = key === "anytime" && formData.get("anonymous") === "on";

  const answers: Record<string, string> = {};
  const ratings: Record<string, number> = {};
  const questionLabels: Record<string, string> = {};
  for (const q of questions) {
    questionLabels[q.key] = q.label;
    const value = formData.get(q.key);
    if (q.type === "text") {
      answers[q.key] = typeof value === "string" ? value.slice(0, 8000).trim() : "";
    } else if (q.type === "rating" && typeof value === "string" && value !== "") {
      const n = Number(value);
      const max = q.scale === "0-10" ? 10 : 5;
      const min = max === 10 ? 0 : 1;
      if (Number.isInteger(n) && n >= min && n <= max) ratings[q.key.startsWith("scale-") ? q.key.slice(6) : q.key] = n;
    }
  }
  // Preserve the written answer exactly, even when a name cannot be matched.
  // Matching names is only a convenience for the pairing generator.
  const acceptsRequests = key === "friday";
  const candidates = acceptsRequests && rankedQuestion ? await oneToOneCandidates(me.id, key) : [];
  const selectable = new Set(candidates.map((person) => person.key));
  const byName = new Map<string, PersonKey | null>();
  for (const person of candidates) {
    const name = normalizePreferenceName(person.name);
    byName.set(name, byName.has(name) ? null : person.key);
  }
  let selectedTargets: PersonKey[] = [];

  if (acceptsRequests && rankedQuestion) {
    const written = String(formData.get("one-on-one-picks") ?? "").slice(0, 8000).trim();
    answers["one-on-one-picks"] = written;
    selectedTargets = written
      .split("\n")
      .map((line) => line.trim().replace(/^(?:\d+[.)]\s*|[-*•]\s*)/, ""))
      .filter(Boolean)
      .map((entry) => selectable.has(entry as PersonKey) ? entry : byName.get(normalizePreferenceName(entry)) ?? "")
      .filter(Boolean)
      .filter((entry, index, all) => all.indexOf(entry) === index)
      .slice(0, MAX_ONE_TO_ONE_PICKS) as PersonKey[];
  }

  // Each form's own required fields, re-checked here rather than trusted from
  // the browser.
  // Anytime is embedded on the index; the rest have their own page.
  const back = key === "anytime" ? "/dashboard/feedback" : `/dashboard/feedback/${key}`;

  for (const q of questions) {
    if (!q.required) continue;
    if (q.type === "ranked") {
      if (acceptsRequests && !answers["one-on-one-picks"]?.trim()) redirect(`${back}?error=1`);
      continue;
    }
    if (q.type === "sessions" || q.type === "conversations") continue;
    const ratingKey = q.key.startsWith("scale-") ? q.key.slice(6) : q.key;
    if (q.type === "text" ? !answers[q.key]?.trim() : !Number.isFinite(ratings[ratingKey])) {
      redirect(`${back}?error=1`);
    }
  }

  if (testing) redirect(`${back}?tested=1`);

  try {
    await saveFeedback({
      isTest: liveTest,
      form: key,
      participantId: anonymous ? "" : me.id,
      participantName: anonymous ? "" : me.name,
      date: form.day,
      sessions: sessionFeedback,
      answers,
      ratings,
      questionLabels,
      preferenceTargets: selectedTargets,
      submittedAt: new Date().toISOString(),
    });
  } catch {
    redirect(`${back}?error=save`);
  }

  if (acceptsRequests && !liveTest) {
    const day = new Date(`${form.day}T12:00:00Z`);
    day.setUTCDate(day.getUTCDate() + 1);
    try {
      await replacePreferences(`participant:${me.id}`, day.toISOString().slice(0, 10), selectedTargets);
    } catch {
      // Portal Feedback already contains the authoritative ranked targets.
      // Pairing generation reads them even if this secondary sync fails.
      console.error("Conversation preference sync failed after feedback was saved");
    }
  }

  // Repeatable forms never get a completion tick.
  if (!REPEATABLE_FORMS.has(key)) await markFormCompleted(me.id, key);

  redirect(`${back}?saved=1`);
}
