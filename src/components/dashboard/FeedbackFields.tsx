import RatingScale from "./RatingScale";
import TextQuestion from "./TextQuestion";
import type { FeedbackQuestion } from "@/server/feedback-questions";

export default function FeedbackFields({ questions }: {
  questions: FeedbackQuestion[];
}) {
  return questions.filter((q) => q.enabled).map((q) => {
    if (q.type !== "text" && q.type !== "rating") return null;
    if (q.type === "rating") {
      const outOfTen = q.scale === "0-10";
      return <RatingScale key={q.key} name={q.key} legend={q.label} required={q.required}
        kind={outOfTen ? "numbers" : "stars"} minimum={outOfTen ? 0 : 1}
        maximum={outOfTen ? 10 : 5} leftLabel={outOfTen ? "Not at all" : ""}
        rightLabel={outOfTen ? "Extremely" : ""} />;
    }
    return <TextQuestion key={q.key} name={q.key} label={q.label} required={q.required}
      rows={q.key === "comment" ? 8 : 4} />;
  });
}
