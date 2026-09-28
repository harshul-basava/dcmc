"use server";

import { redirect } from "next/navigation";
import { requireParticipant } from "@/server/auth";
import { getSessions, replacePreferences, saveFeedback } from "@/server/data";
import { personLookup } from "@/server/people";
import { getFeedbackQuestions } from "@/server/feedback-questions";
import type { PersonKey } from "@/server/data/types";
import {
  MAX_ONE_TO_ONE_PICKS,
  REPEATABLE_FORMS,
  feedbackForm,
  feedbackFormOpen,
  markFormCompleted,
  oneToOneCandidates,
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
  const questions = (await getFeedbackQuestions(key)).filter((q) => q.enabled);
  const rankedQuestion = questions.find((q) => q.type === "ranked");
  const showSessionRatings = questions.some((q) => q.type === "sessions");
  const showConversations = questions.some((q) => q.type === "conversations");

  const sessions = await getSessions();
  // Mirrors the page: only the overall form rates individual sessions.
  const rated =
    key === "overall" && showSessionRatings
      ? sessions.filter((s) => ["talk", "panel", "workshop"].includes(s.type))
      : [];

  const sessionFeedback = rated.map((session) => {
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
  if (key === "one-on-ones" && showConversations) {
    for (const [name, value] of formData.entries()) {
      if (typeof value !== "string") continue;
      if (name.startsWith("conv-comment-")) answers[name] = value.slice(0, 4000);
      if (name.startsWith("scale-conv-")) {
        const n = Number(value);
        if (Number.isInteger(n) && n >= 1 && n <= 5) ratings[name.slice(6)] = n;
      }
    }
  }

  // The picker sends person keys. Its no-JavaScript textarea accepts names;
  // resolve those against the same eligible directory roster.
  const daily = key === "friday" || key === "saturday";
  const candidates = daily ? await oneToOneCandidates(me.id) : [];
  const selectable = new Set(candidates.map((person) => person.key));
  const byName = new Map<string, PersonKey | null>();
  for (const person of candidates) {
    const name = person.name.toLocaleLowerCase().trim();
    byName.set(name, byName.has(name) ? null : person.key);
  }
  let selectedTargets: PersonKey[] = [];

  if (daily && rankedQuestion) {
    const people = await personLookup();
    selectedTargets = String(formData.get("one-on-one-picks") ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((entry) => selectable.has(entry as PersonKey) ? entry : byName.get(entry.toLocaleLowerCase()) ?? "")
      .filter(Boolean)
      .filter((entry, index, all) => all.indexOf(entry) === index)
      .slice(0, MAX_ONE_TO_ONE_PICKS) as PersonKey[];
    const picks = selectedTargets
      // The picker sends person keys; resolve them to names so the stored
      // answer is readable.
      .map((entry, index) => `${index + 1}. ${people.get(entry)?.name ?? entry}`);
    answers["one-on-one-picks"] = picks.join("\n");
  }

  // Each form's own required fields, re-checked here rather than trusted from
  // the browser.
  // Anytime is embedded on the index; the rest have their own page.
  const back = key === "anytime" ? "/dashboard/feedback" : `/dashboard/feedback/${key}`;

  for (const q of questions) {
    if (!q.required) continue;
    if (q.type === "ranked") {
      if (daily && candidates.length && !selectedTargets.length) redirect(`${back}?error=1`);
      continue;
    }
    if (q.type === "sessions" || q.type === "conversations") continue;
    const ratingKey = q.key.startsWith("scale-") ? q.key.slice(6) : q.key;
    if (q.type === "text" ? !answers[q.key]?.trim() : !Number.isFinite(ratings[ratingKey])) {
      redirect(`${back}?error=1`);
    }
  }

  await saveFeedback({
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

  if (daily) {
    const day = new Date(`${form.day}T12:00:00Z`);
    day.setUTCDate(day.getUTCDate() + 1);
    await replacePreferences(`participant:${me.id}`, day.toISOString().slice(0, 10), selectedTargets);
  }

  // Repeatable forms never get a completion tick.
  if (!REPEATABLE_FORMS.has(key)) await markFormCompleted(me.id, key);

  redirect(`${back}?saved=1`);
}
