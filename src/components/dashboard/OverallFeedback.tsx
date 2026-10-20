import type { ReactNode } from "react";
import type { FeedbackQuestion } from "@/server/feedback-questions";
import type { SessionRatingOption } from "@/server/session-ratings";
import FeedbackFields from "./FeedbackFields";
import RatingScale from "./RatingScale";
import TextQuestion from "./TextQuestion";

function Section({ id, title, description, children }: {
  id: string; title: string; description?: string; children: ReactNode;
}) {
  return (
    <section id={id} className="overall-feedback-section scroll-mt-24" aria-labelledby={`${id}-heading`}>
      <header className="mb-7">
        <h2 id={`${id}-heading`} className="font-display text-2xl tracking-tight text-balance text-foreground">{title}</h2>
        {description ? <p className="mt-2 text-pretty text-sm leading-relaxed text-muted">{description}</p> : null}
      </header>
      {children}
    </section>
  );
}

export default function OverallFeedback({ questions, sessions }: {
  questions: FeedbackQuestion[]; sessions: SessionRatingOption[];
}) {
  const visible = questions.filter((q) => q.enabled);
  const outcomes = visible.filter((q) => q.key.startsWith("scale-clarity-"));
  const experience = visible.filter((q) => q.type === "rating" && !q.key.startsWith("scale-clarity-"));
  const reflections = visible.filter((q) => q.type === "text");
  const sessionQuestion = visible.find((q) => q.type === "sessions");
  const days = new Map<string, SessionRatingOption[]>();
  for (const session of sessions) {
    const day = session.timeLabel.split(" · ")[0];
    days.set(day, [...(days.get(day) ?? []), session]);
  }
  let number = 0;
  const sections = [
    ...(experience.length ? [{ id: "overall-experience", title: "Overall experience" }] : []),
    ...(sessionQuestion && sessions.length ? [{ id: "session-ratings", title: "Session ratings" }] : []),
    ...(outcomes.length ? [{ id: "conference-outcomes", title: "Conference outcomes" }] : []),
    ...(reflections.length ? [{ id: "reflections", title: "Reflections & next steps" }] : []),
  ];

  return (
    <div className="overall-feedback grid gap-7">
      <nav aria-label="Feedback sections" className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted">
        {sections.map((section) => <a key={section.id} href={`#${section.id}`} className="inline-flex min-h-10 items-center underline decoration-rule underline-offset-4 hover:text-accent">{section.title}</a>)}
      </nav>
      {experience.length ? <Section id="overall-experience" title="Overall experience" description="Start with your impression of the conference as a whole.">
        <div className="grid gap-8"><FeedbackFields questions={experience} /></div>
      </Section> : null}
      {sessionQuestion && sessions.length ? <Section id="session-ratings" title={sessionQuestion.label} description="Every rating is optional. Rate only the activities you attended and Q&A guests you spoke with. Your published 1:1 conversations appear individually.">
        {[...days].map(([day, items]) => (
          <div key={day} className="overall-feedback-day">
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted">{day}</h3>
            {items.map((session) => (
              <article key={session.id} className="overall-feedback-session" aria-labelledby={`session-${session.id}`}>
                <header className="mb-4 flex gap-3">
                  <span aria-hidden="true" className="mt-1 w-6 shrink-0 text-xs tabular-nums text-muted">{String(++number).padStart(2, "0")}</span>
                  <div>
                    <p className="mb-1 text-xs text-muted">{session.timeLabel}</p>
                    <h4 id={`session-${session.id}`} className="font-display text-xl leading-snug text-balance text-foreground">{session.title}</h4>
                    {session.speaker ? <p className="mt-1 text-xs text-muted">{session.speaker}</p> : null}
                  </div>
                </header>
                <div className="sm:pl-9">
                  <RatingScale name={`rating-${session.id}`} legend="How valuable was it?" required={false} allowSkip />
                  <details className="mt-3">
                    <summary className="inline-flex min-h-10 cursor-pointer items-center text-xs text-muted underline decoration-rule underline-offset-4 hover:text-accent">Add a comment <span className="ml-1 text-muted">(optional)</span></summary>
                    <div className="pt-2"><TextQuestion name={`comment-${session.id}`} label={`Comments on ${session.title}`} rows={2} /></div>
                  </details>
                </div>
              </article>
            ))}
          </div>
        ))}
      </Section> : null}
      {outcomes.length ? <Section id="conference-outcomes" title="Conference outcomes" description="How much do you agree with each statement?">
        <div className="grid gap-9"><FeedbackFields questions={outcomes} /></div>
      </Section> : null}
      {reflections.length ? <Section id="reflections" title="Reflections & next steps" description="Share what you’re taking away and what we could improve.">
        <div className="grid gap-8"><FeedbackFields questions={reflections} /></div>
      </Section> : null}
    </div>
  );
}
