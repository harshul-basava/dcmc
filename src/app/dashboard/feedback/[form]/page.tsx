import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import PortalShell from "@/components/dashboard/PortalShell";
import BackLink from "@/components/dashboard/BackLink";
import PageHeading from "@/components/dashboard/PageHeading";
import RatingScale from "@/components/dashboard/RatingScale";
import TextQuestion from "@/components/dashboard/TextQuestion";
import FeedbackFields from "@/components/dashboard/FeedbackFields";
import RankedNames from "@/components/dashboard/RankedNames";
import { requireParticipant } from "@/server/auth";
import { getSessions } from "@/server/data";
import { getFeedbackQuestions } from "@/server/feedback-questions";
import { MAX_ONE_TO_ONE_PICKS, feedbackForm, feedbackFormOpen, oneToOneCandidates, oneToOneConversations } from "@/server/feedback";
import { submitFeedback } from "../actions";

export default async function FeedbackFormPage({ params, searchParams }: {
  params: Promise<{ form: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const me = await requireParticipant("feedback");
  const { form: key } = await params;
  const { saved, error } = await searchParams;
  const form = feedbackForm(key);
  if (!form) notFound();
  if (key === "anytime") redirect("/dashboard/feedback");
  if (!(await feedbackFormOpen(key))) redirect("/dashboard/feedback");

  if (saved) return (
    <PortalShell role="participant" active="feedback">
      <div className="mx-auto max-w-lg py-16 text-center">
        <p className="font-display text-3xl text-foreground">Thank you</p>
        <p className="mt-3 text-sm text-muted">Your {form.label.toLowerCase()} response was saved.</p>
        <Link href="/dashboard/feedback" className="mt-8 inline-block text-sm text-accent underline underline-offset-2">All feedback forms</Link>
      </div>
    </PortalShell>
  );

  const [questions, sessions] = await Promise.all([getFeedbackQuestions(key), getSessions()]);
  const rated = key === "overall" ? sessions.filter((s) => ["talk", "panel", "workshop"].includes(s.type)) : [];
  const conversations = key === "one-on-ones" ? await oneToOneConversations(me.id) : [];
  const daily = key === "friday" || key === "saturday";
  const candidates = daily ? await oneToOneCandidates(me.id) : [];

  return (
    <PortalShell role="participant" active="feedback">
      <div className="mx-auto w-full max-w-2xl">
        <BackLink href="/dashboard/feedback">All feedback forms</BackLink>
        <PageHeading title={form.title} lead={form.description} />
        {error ? <p role="alert" className="mb-6 rounded-card border border-accent bg-[color:var(--red-50)] p-4 text-sm text-accent">Please answer the required questions before submitting.</p> : null}
        <form action={submitFeedback} className="grid gap-8">
          <input type="hidden" name="form" value={key} />
          {questions.filter((q) => q.enabled).map((q) => {
            if (q.type === "text" || q.type === "rating") {
              return <FeedbackFields key={q.key} questions={[q]} />;
            }
            if (q.type === "ranked" && daily) return (
              <div key={q.key} className="grid gap-2">
                <span className="text-sm text-foreground">{q.label}</span>
                {candidates.length ? (
                  <>
                    <p className="text-xs text-muted">Select a name to see their bio, and drag to change the order.</p>
                    <RankedNames name="one-on-one-picks" candidates={candidates} max={MAX_ONE_TO_ONE_PICKS} />
                  </>
                ) : <p className="rounded-card border border-dashed border-rule px-5 py-6 text-sm text-muted">Names will appear here as profiles are completed.</p>}
              </div>
            );
            if (q.type === "conversations" && key === "one-on-ones") return (
              <section key={q.key} className="grid gap-6">
                <h2 className="font-display text-lg tracking-tight text-foreground">{q.label}</h2>
                {conversations.length ? conversations.map((conversation) => (
                  <div key={conversation.id} className="grid gap-3 rounded-card border border-rule bg-card p-5">
                    <div><strong className="font-display text-base font-medium text-foreground">{conversation.partner}</strong>
                      <span className="block text-xs text-muted">{conversation.day} · {conversation.timeLabel}</span></div>
                    <RatingScale name={`scale-conv-${conversation.id}`} legend="How valuable was it?" required={false} />
                    <TextQuestion name={`conv-comment-${conversation.id}`} label="Anything to add?" rows={2} />
                  </div>
                )) : <p className="rounded-card border border-dashed border-rule px-6 py-10 text-center text-sm text-muted">Your conversations will appear once pairings are released.</p>}
              </section>
            );
            if (q.type === "sessions" && key === "overall" && rated.length) return (
              <section key={q.key} className="grid gap-6">
                <h2 className="font-display text-lg tracking-tight text-foreground">{q.label}</h2>
                {rated.map((session) => (
                  <div key={session.id} className="grid gap-3 rounded-card border border-rule bg-card p-5">
                    <div><strong className="font-display text-base font-medium text-foreground">{session.title}</strong>
                      {session.speaker ? <span className="block text-xs text-muted">{session.speaker}</span> : null}</div>
                    <RatingScale name={`rating-${session.id}`} legend="How valuable was it?" required={false} />
                    <TextQuestion name={`comment-${session.id}`} label="Anything to add?" rows={2} />
                  </div>
                ))}
              </section>
            );
            return null;
          })}
          <div><button type="submit" className="min-h-11 rounded-card bg-accent px-7 text-sm font-semibold text-on-accent transition hover:bg-accent-hover">Submit feedback</button></div>
        </form>
      </div>
    </PortalShell>
  );
}
