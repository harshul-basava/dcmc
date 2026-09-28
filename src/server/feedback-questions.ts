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

type EditableForm = "goals" | "friday" | "saturday" | "overall" | "one-on-ones" | "anytime";
export const EDITABLE_FORMS: EditableForm[] = ["goals", "friday", "saturday", "overall", "one-on-ones", "anytime"];

const question = (key: string, label: string, position: number, type: FeedbackQuestion["type"] = "text", required = false): FeedbackQuestion =>
  ({ key, label, position, type, required, enabled: true,
    scale: key === "scale-satisfaction" || key === "scale-recommend" ? "0-10" : "1-5" });

const daily = [
  question("scale-day", "How valuable was the day overall?", 1, "rating", true),
  question("day-comments", "Comments", 2),
  question("learned", "What is one valuable thing that you learned today?", 3, "text", true),
  question("detracting", "Is anything detracting from the workshop, and is there anything that would improve your experience?", 4),
  question("most-value", "Who have you gotten the most value from talking to?", 5),
  question("additional", "Is there anything else you would like us to know?", 6),
];

const defaults: Record<EditableForm, FeedbackQuestion[]> = {
  goals: [
    question("goal-blockers", "What are your biggest blockers to working in AI governance right now?", 1, "text", true),
    question("goal-questions", "What questions do you want answered before you leave?", 2, "text", true),
    question("goal-outcome", "If these three days go as well as they possibly could, what happens?", 3, "text", true),
    question("goal-actions", "What can you do to make this happen?", 4, "text", true),
    question("goal-obstacles", "What would prevent this outcome?", 5, "text", true),
  ],
  friday: daily,
  saturday: daily,
  overall: [
    question("scale-satisfaction", "Overall, how satisfied were you with the conference?", 1, "rating"),
    question("scale-recommend", "How likely are you to recommend it to someone like you?", 2, "rating"),
    question("learned", "One valuable thing you learned", 3, "text", true),
    question("additional", "Anything else we should know?", 4),
  ],
  "one-on-ones": [
    question("conversation-ratings", "Your conversations", 1, "conversations"),
    question("one-on-ones-overall", "What did you think of the one-on-ones overall?", 2, "text", true),
    question("one-on-ones-more", "Anyone you wish you had met?", 3),
  ],
  anytime: [question("comment", "Feedback", 1, "text", true)],
};

daily.splice(3, 0, question("one-on-one-picks", "List up to 10 people you would like to have 1:1s with tomorrow.", 4, "ranked", true));
daily.forEach((q, index) => { q.position = index + 1; });
defaults.overall.splice(2, 0, question("session-ratings", "Sessions", 3, "sessions"));
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
    if (form && ((q.type === "ranked" && !["friday", "saturday"].includes(form)) ||
      (q.type === "sessions" && form !== "overall") ||
      (q.type === "conversations" && form !== "one-on-ones"))) return null;
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
      const parsed = validateQuestions(JSON.parse(stored.label), form);
      if (parsed) return parsed;
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
