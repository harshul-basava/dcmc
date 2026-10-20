import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import PortalShell from "@/components/dashboard/PortalShell";
import BackLink from "@/components/dashboard/BackLink";
import PageHeading from "@/components/dashboard/PageHeading";
import RatingScale from "@/components/dashboard/RatingScale";
import TextQuestion from "@/components/dashboard/TextQuestion";
import FeedbackFields from "@/components/dashboard/FeedbackFields";
import OneToOneRequests from "@/components/dashboard/OneToOneRequests";
import { isPreviewing, requireParticipant } from "@/server/auth";
import { getFeedback } from "@/server/data";
import { getFeedbackQuestions } from "@/server/feedback-questions";
import { feedbackForm, feedbackFormOpen, oneToOneGuestOptions } from "@/server/feedback";
import { sessionRatingOptions } from "@/server/session-ratings";
import { submitFeedback } from "../actions";

export default async function FeedbackFormPage({ params, searchParams }: {
  params: Promise<{ form: string }>;
  searchParams: Promise<{ saved?: string; tested?: string; error?: string }>;
}) {
  const me = await requireParticipant("feedback");
  const { form: key } = await params;
  const { saved, tested, error } = await searchParams;
  const testing = await isPreviewing();
  if (key === "one-on-ones") redirect("/dashboard/feedback/overall");
  const form = feedbackForm(key);
  if (!form) notFound();
  if (key === "anytime") redirect("/dashboard/feedback");
  if (!testing && !(await feedbackFormOpen(key))) redirect("/dashboard/feedback");

  if (saved) return (
    <PortalShell role="participant" active="feedback">
      <div className="mx-auto max-w-lg py-16 text-center">
        <p className="font-display text-3xl text-foreground">Thank you</p>
        <p className="mt-3 text-sm text-muted">Your {form.label.toLowerCase()} response was saved.</p>
        <Link href="/dashboard/feedback" className="mt-8 inline-block text-sm text-accent underline underline-offset-2">All feedback forms</Link>
      </div>
    </PortalShell>
  );

  const questions = await getFeedbackQuestions(key);
  const previousGoals = key === "goals"
    ? (await getFeedback()).find((response) => response.form === "goals" && response.participantId === me.id)
    : undefined;
  const rated = key === "overall" && questions.some((q) => q.enabled && q.type === "sessions")
    ? await sessionRatingOptions(me.id) : [];
  const daily = key === "friday" || key === "saturday";
  const guestOptions = daily ? await oneToOneGuestOptions(key) : [];

  return (
    <PortalShell role="participant" active="feedback">
      <div className="mx-auto w-full max-w-2xl">
        <BackLink href="/dashboard/feedback">All feedback forms</BackLink>
        <PageHeading title={form.title} lead={form.description} />
        {testing ? <p className="mb-6 rounded-card border border-rule bg-card p-4 text-sm text-muted">Feedback test: closed forms are available. Submitting checks your answers without saving a response or changing pairing requests. <a href="/dashboard/admin/feedback" className="text-accent underline">Back to admin feedback</a></p> : null}
        {testing && tested ? <p role="status" className="mb-6 text-sm text-[color:var(--color-success)]">Test passed. Your answers were valid. Nothing was saved.</p> : null}
        {key === "goals" ? <p className="mb-6 text-sm text-muted">You can return to review and update your goals. Your responses are also visible to conference organizers.</p> : null}
        {error ? <p role="alert" className="mb-6 rounded-card border border-accent bg-[color:var(--red-50)] p-4 text-sm text-accent">{error === "save" ? "Your response could not be saved. Please try again." : "Please answer the required questions before submitting."}</p> : null}
        <form action={submitFeedback} className="grid gap-8">
          <input type="hidden" name="form" value={key} />
          {questions.filter((q) => q.enabled).map((q) => {
            if (q.type === "text" || q.type === "rating") {
              return <FeedbackFields key={q.key} questions={[q]} answers={previousGoals?.answers} ratings={previousGoals?.ratings} />;
            }
            if (q.type === "ranked" && daily) return (
              <OneToOneRequests key={q.key} question={q} guests={guestOptions} />
            );
            if (q.type === "sessions" && key === "overall" && rated.length) return (
              <section key={q.key} className="grid gap-6">
                <h2 className="font-display text-lg tracking-tight text-foreground">{q.label}</h2>
                <p className="text-sm text-muted">All ratings are optional. Only rate activities you attended and rotating Q&A guests you spoke with. Each 1:1 conversation is listed separately once pairings are released.</p>
                {rated.map((session) => (
                  <div key={session.id} className="grid gap-3 rounded-card border border-rule bg-card p-5">
                    <div><strong className="font-display text-base font-medium text-foreground">{session.title}</strong>
                      <span className="block text-xs text-muted">{session.timeLabel}</span>
                      {session.speaker ? <span className="block text-xs text-muted">{session.speaker}</span> : null}</div>
                    <RatingScale name={`rating-${session.id}`} legend="How valuable was it?" required={false} allowSkip />
                    <TextQuestion name={`comment-${session.id}`} label="Anything to add?" rows={2} />
                  </div>
                ))}
              </section>
            );
            return null;
          })}
          <div><button type="submit" className="min-h-11 rounded-card bg-accent px-7 text-sm font-semibold text-on-accent transition hover:bg-accent-hover">{testing ? "Test submission" : key === "goals" ? "Save goals" : "Submit feedback"}</button></div>
        </form>
      </div>
    </PortalShell>
  );
}
