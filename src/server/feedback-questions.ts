import { getPortalPageSettings, savePortalPageSetting } from "./data";

export type FeedbackQuestion = {
  key: string;
  label: string;
  type: "text" | "rating" | "ranked" | "sessions" | "conversations";
  scale: "1-5" | "0-10";
  required: boolean;
  enabled: boolean;
  position: number;
};

type EditableForm = "goals" | "friday" | "saturday" | "overall" | "anytime";
export const EDITABLE_FORMS: EditableForm[] = ["goals", "friday", "saturday", "overall", "anytime"];

export const OVERALL_EXPERIENCE_KEYS = ["scale-food", "scale-venue", "best-things", "worst-things", "conference-conversations"];

const question = (key: string, label: string, position: number, type: FeedbackQuestion["type"] = "text", required = false): FeedbackQuestion =>
  ({ key, label, position, type, required, enabled: true,
    scale: key === "scale-satisfaction" || key === "scale-recommend" || key.startsWith("scale-clarity-") ? "0-10" : "1-5" });

const daily = [
  question("scale-day", "How valuable was the day overall?", 1, "rating", true),
  question("day-comments", "Comments", 2),
  question("learned", "What is one valuable thing that you learned today?", 3, "text", true),
  question("detracting", "Is anything detracting from the workshop, and is there anything that would improve your experience?", 4),
  question("most-value", "Who did you get the most value from talking to today?", 5),
  question("additional", "Is there anything else you would like us to know?", 6),
];

const defaults: Record<EditableForm, FeedbackQuestion[]> = {
  goals: [
    question("goal-blockers", "What draws you to working in AI governance?", 1, "text", true),
    question("goal-questions", "What questions do you want answered before you leave?", 2, "text", true),
    question("goal-outcome", "If these three days go as well as they possibly could, what happens?", 3, "text", true),
    question("goal-actions", "What can you do to make this happen?", 4, "text", true),
    question("goal-obstacles", "What would prevent this outcome?", 5, "text", true),
  ],
  friday: daily.map((q) => ({ ...q })),
  saturday: daily,
  overall: [
    question("overall-thoughts", "Without anchoring you on anything specific, what did you think of the conference overall?", 1, "text", true),
    question("session-ratings", "Sessions", 2, "sessions"),
    question("scale-food", "How was the food?", 3, "rating", true),
    question("scale-venue", "How was the venue?", 4, "rating", true),
    question("best-things", "What were the best things about this conference?", 5, "text", true),
    question("worst-things", "What were the worst things about this conference?", 6, "text", true),
    question("conference-conversations", "Over the whole conference, who are 5+ people you’ve personally had the best conversations with or gotten the most value from? Did anyone detract from your experience? If so, explain briefly.", 7, "text", true),
    question("scale-clarity-uncertainties", "During this conference, I gained clarity on my main uncertainties, questions, or disagreements in AI governance.", 8, "rating", true),
    question("scale-clarity-next-steps", "This conference helped me gain clarity on next steps I want to take.", 9, "rating", true),
    question("scale-satisfaction", "Overall, how satisfied were you with the conference?", 10, "rating"),
    question("scale-recommend", "How likely are you to recommend it to someone like you?", 11, "rating"),
    question("learned", "One valuable thing you learned", 12, "text", true),
    question("one-on-ones-more", "Anyone you wish you had met?", 13),
    question("additional", "Anything else we should know?", 14),
  ],
  anytime: [question("comment", "Feedback", 1, "text", true)],
};

defaults.friday.splice(3, 0, question("one-on-one-picks", "List up to 10 attendees and guests you would like to have 1:1s with tomorrow (Saturday), in order of preference.", 4, "ranked", true));
defaults.friday.forEach((q, index) => { q.position = index + 1; });
defaults.overall.forEach((q, index) => { q.position = index + 1; });

export function defaultFeedbackQuestions(form: string): FeedbackQuestion[] {
  return EDITABLE_FORMS.includes(form as EditableForm) ? defaults[form as EditableForm].map((q) => ({ ...q })) : [];
}

export function validateQuestions(value: unknown, form?: string): FeedbackQuestion[] | null {
  if (!Array.isArray(value) || value.length > 50) return null;
  const keys = new Set<string>();
  const result: FeedbackQuestion[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") return null;
    const q = item as Partial<FeedbackQuestion>;
    if (typeof q.key !== "string" || !/^[a-z][a-z0-9-]{0,63}$/.test(q.key) || keys.has(q.key)) return null;
    if (typeof q.label !== "string" || !q.label.trim() || q.label.length > 500) return null;
    if (q.type !== "text" && q.type !== "rating" && q.type !== "ranked" && q.type !== "sessions" && q.type !== "conversations") return null;
    if (form && ((q.type === "ranked" && form !== "friday") ||
      (q.type === "sessions" && form !== "overall") ||
      (q.type === "conversations" && form !== "overall"))) return null;
    keys.add(q.key);
    result.push({ key: q.key, label: q.label.trim(), type: q.type,
      scale: q.scale === "0-10" ? "0-10" : "1-5",
      required: q.required === true, enabled: q.enabled !== false,
      position: Number.isFinite(q.position) ? Math.max(0, Math.min(1000, Number(q.position))) : result.length + 1 });
  }
  return result.sort((a, b) => a.position - b.position);
}

export async function getFeedbackQuestions(form: string): Promise<FeedbackQuestion[]> {
  const stored = (await getPortalPageSettings()).find((s) => s.audience === "all" && s.key === `questions:${form}`);
  if (stored) {
    try {
      // Conversations now belong to session ratings, so retire the old
      // separate section while retaining existing responses and other edits.
      const saved: unknown = JSON.parse(stored.label);
      // Saturday previously requested Sunday pairings, but Sunday has none.
      // Remove only the obsolete request question before schema validation.
      const current = form === "saturday" && Array.isArray(saved)
        ? saved.filter((q) => q?.type !== "ranked" && q?.key !== "one-on-one-picks") : saved;
      const parsed = validateQuestions(current, form)?.filter((q) => q.type !== "conversations" && !(form === "overall" && q.key === "one-on-ones-overall"));
      if (parsed) {
        for (const q of parsed) {
          if (form === "goals" && q.key === "goal-blockers" && q.label === "What are your biggest blockers to working in AI governance?") {
            q.label = defaults.goals.find((item) => item.key === q.key)!.label;
          }
          if (form === "overall" && q.key === "scale-clarity-uncertainties" && q.label === "During this conference, I gained clarity on my main uncertainties, questions, or disagreements about working in AI governance.") {
            q.label = defaults.overall.find((item) => item.key === q.key)!.label;
          }
          if ((form === "friday" || form === "saturday") && q.key === "most-value" && q.label === "Who have you gotten the most value from talking to?") {
            q.label = "Who did you get the most value from talking to today?";
          }
          if (q.key === "one-on-one-picks" && ["List up to 10 people you would like to have 1:1s with tomorrow.", "List up to 10 attendees and guests you would like to have 1:1s with tomorrow, in order of preference."].includes(q.label)) {
            q.label = defaults.friday.find((item) => item.key === q.key)!.label;
          }
        }
        // Existing overall forms predate the conversation questions. Add the
        // missing fields without replacing organizers' edits or visibility.
        if (form === "overall") {
          const keys = new Set(parsed.map((q) => q.key));
          const additions = defaults.overall.filter((q) =>
            ["overall-thoughts", "one-on-ones-more", "scale-clarity-uncertainties", "scale-clarity-next-steps", ...OVERALL_EXPERIENCE_KEYS].includes(q.key) && !keys.has(q.key));
          const lastPosition = Math.max(0, ...parsed.map((q) => q.position));
          return [...parsed, ...additions.map((q, index) => ({ ...q, position: lastPosition + index + 1 }))];
        }
        return parsed;
      }
    } catch { /* Preserve defaults if a row was hand-edited incorrectly. */ }
  }
  return defaultFeedbackQuestions(form);
}

export async function saveFeedbackQuestions(form: string, questions: FeedbackQuestion[]): Promise<void> {
  if (!EDITABLE_FORMS.includes(form as EditableForm)) throw new Error("Unknown feedback form");
  const checked = validateQuestions(questions, form);
  if (!checked || !checked.some((q) => q.enabled)) throw new Error("Invalid feedback questions");
  await savePortalPageSetting("all", `questions:${form}`, JSON.stringify(checked), true);
}
