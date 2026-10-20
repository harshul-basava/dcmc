import RatingScale from "./RatingScale";
import TextQuestion from "./TextQuestion";
import type { FeedbackQuestion } from "@/server/feedback-questions";

export default function FeedbackFields({ questions, answers = {}, ratings = {} }: {
  questions: FeedbackQuestion[];
  answers?: Record<string, string>;
  ratings?: Record<string, number>;
}) {
  return questions.filter((q) => q.enabled).map((q) => {
    if (q.type !== "text" && q.type !== "rating") return null;
    if (q.type === "rating") {
      const outOfTen = q.scale === "0-10";
      const agreement = q.key.startsWith("scale-clarity-");
      return <RatingScale key={q.key} name={q.key} legend={q.label} required={q.required}
        defaultValue={ratings[q.key.startsWith("scale-") ? q.key.slice(6) : q.key]}
        kind={outOfTen ? "numbers" : "stars"} minimum={outOfTen ? 0 : 1}
        maximum={outOfTen ? 10 : 5} leftLabel={agreement ? "Strongly disagree" : outOfTen ? "Not at all" : ""}
        rightLabel={agreement ? "Strongly agree" : outOfTen ? "Extremely" : ""} />;
    }
    return <TextQuestion key={q.key} name={q.key} label={q.label} required={q.required}
      description={q.key === "most-value" ? "This can be an attendee or a guest." : undefined}
      defaultValue={answers[q.key]} rows={q.key === "comment" ? 8 : 4} />;
  });
}
