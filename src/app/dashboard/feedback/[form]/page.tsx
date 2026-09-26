import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import PortalShell from "@/components/dashboard/PortalShell";
import PageHeading from "@/components/dashboard/PageHeading";
import RatingScale from "@/components/dashboard/RatingScale";
import TextQuestion from "@/components/dashboard/TextQuestion";
import { requireParticipant } from "@/server/auth";
import { getSessions } from "@/server/data";
import RankedNames from "@/components/dashboard/RankedNames";
import {
  MAX_ONE_TO_ONE_PICKS,
  feedbackForm,
  feedbackFormOpen,
  oneToOneCandidates,
  oneToOneConversations,
} from "@/server/feedback";
import { submitFeedback } from "../actions";

export default async function FeedbackFormPage({
  params,
  searchParams,
}: {
  params: Promise<{ form: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const me = await requireParticipant("feedback");

  const { form: key } = await params;
  const { saved, error } = await searchParams;

  const form = feedbackForm(key);
  if (!form) notFound();
  // Anytime is embedded on the index rather than living on its own page.
  if (key === "anytime") redirect("/dashboard/feedback");
  // A closed form must refuse a direct request, not merely hide its link.
  if (!(await feedbackFormOpen(key))) redirect("/dashboard/feedback");

  if (saved) {
    return (
      <PortalShell role="participant" active="feedback">
        <div className="mx-auto max-w-lg py-16 text-center">
          <p className="font-display text-3xl text-foreground">Thank you</p>
          <p className="mt-3 text-sm text-muted">
            Your {form.label.toLowerCase()} response was saved.
          </p>
          <Link
            href="/dashboard/feedback"
            className="mt-8 inline-block text-sm text-accent underline underline-offset-2"
          >
            All feedback forms
          </Link>
        </div>
      </PortalShell>
    );
  }

  const sessions = await getSessions();
  // Only the overall form rates individual sessions. The daily forms ask about
  // the day as a whole and spend their length on 1:1 requests instead.
  const rated =
    key === "overall"
      ? sessions.filter((s) => ["talk", "panel", "workshop"].includes(s.type))
      : [];
  const conversations = key === "one-on-ones" ? await oneToOneConversations(me.id) : [];

  const daily = key === "friday" || key === "saturday";
  const candidates = daily ? await oneToOneCandidates(me.id) : [];

  return (
    <PortalShell role="participant" active="feedback">
      <div className="mx-auto w-full max-w-2xl">
        <Link
          href="/dashboard/feedback"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            width="13"
            height="13"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10 3L5 8l5 5" />
          </svg>
          All feedback forms
        </Link>

        {/* Anytime is a single box; its description would only repeat the label. */}
        <PageHeading title={form.title} lead={key === "anytime" ? undefined : form.description} />

      {error ? (
        <p role="alert" className="mb-6 rounded-card border border-accent bg-[color:var(--red-50)] p-4 text-sm text-accent">
          Please answer the required questions before submitting.
        </p>
      ) : null}

      <form action={submitFeedback} className="grid gap-8">
        <input type="hidden" name="form" value={key} />

        {key === "anytime" ? (
          <TextQuestion
            name="comment"
            label="Feedback"
            required
            rows={8}
            aside={
              <label className="flex items-center gap-2 text-xs text-muted">
                Submit Anonymously
                <input
                  type="checkbox"
                  name="anonymous"
                  className="h-4 w-4 accent-[color:var(--color-accent)]"
                />
              </label>
            }
          />
        ) : key === "goals" ? (
          <>
            <TextQuestion
              name="goal-blockers"
              label="What are your biggest blockers to working in AI governance right now?"
              required
              rows={3}
            />
            <TextQuestion
              name="goal-questions"
              label="What questions do you want answered before you leave?"
              required
              rows={3}
            />

            <div className="grid gap-6">
              <TextQuestion
                name="goal-outcome"
                label="If these three days go as well as they possibly could, what happens?"
                required
                rows={4}
              />

              {/* Follow-ups on that answer, indented so they read as part of it. */}
              <div className="grid gap-6 border-l-2 border-rule pl-5">
                <TextQuestion
                  name="goal-actions"
                  label="What can you do to make this happen?"
                  required
                  rows={3}
                />
                <TextQuestion
                  name="goal-obstacles"
                  label="What would prevent this outcome?"
                  required
                  rows={3}
                />
              </div>
            </div>
          </>
        ) : key === "one-on-ones" ? (
          <>
            {conversations.length ? (
              <section className="grid gap-6">
                <h2 className="font-display text-lg tracking-tight text-foreground">
                  Your conversations
                </h2>
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className="grid gap-3 rounded-card border border-rule bg-card p-5"
                  >
                    <div>
                      <strong className="font-display text-base font-medium text-foreground">
                        {conversation.partner}
                      </strong>
                      <span className="block text-xs text-muted">
                        {conversation.day} · {conversation.timeLabel}
                      </span>
                    </div>
                    <RatingScale
                      name={`scale-conv-${conversation.id}`}
                      legend="How valuable was it?"
                    />
                    <TextQuestion
                      name={`conv-comment-${conversation.id}`}
                      label="Anything to add?"
                      rows={2}
                    />
                  </div>
                ))}
              </section>
            ) : (
              <p className="rounded-card border border-dashed border-rule px-6 py-10 text-center text-sm text-muted">
                You have no published one-on-ones yet. This form will list them once pairings
                are released.
              </p>
            )}

            <TextQuestion
              name="one-on-ones-overall"
              label="What did you think of the one-on-ones overall?"
              required
              rows={4}
            />
            <TextQuestion
              name="one-on-ones-more"
              label="Anyone you wish you had met?"
              rows={3}
            />
          </>
        ) : daily ? (
          <>
            <RatingScale
              name="scale-day"
              legend="How valuable was the day overall?"
              leftLabel=""
              rightLabel=""
            />
            <TextQuestion name="day-comments" label="Comments" rows={4} />

            <TextQuestion
              name="learned"
              label="What is one valuable thing that you learned today?"
              required
              rows={4}
            />

            <div className="grid gap-2">
              <span className="text-sm text-foreground">
                Please list up to {MAX_ONE_TO_ONE_PICKS} names, in order, of people you would
                like to have 1-1s with tomorrow.
                {candidates.length ? (
                  <span aria-hidden="true" className="ml-1 text-accent">
                    *
                  </span>
                ) : null}
              </span>

              {candidates.length ? (
                <>
                  <p className="text-xs text-muted">
                    You can list other attendees or guest speakers. Select a name to see their
                    bio, and drag to change the order.
                  </p>
                  <RankedNames
                    name="one-on-one-picks"
                    candidates={candidates}
                    max={MAX_ONE_TO_ONE_PICKS}
                  />
                </>
              ) : (
                /* The list only offers people who appear in a directory. With
                   nobody there yet the question cannot be answered, so it says
                   so rather than blocking the form behind it. */
                <p className="rounded-card border border-dashed border-rule px-5 py-6 text-sm text-muted">
                  Nobody has completed their profile yet, so there is nobody to list here. This
                  question will open once attendees have added a headshot and a bio.
                </p>
              )}
            </div>

            <TextQuestion
              name="detracting"
              label="Is anything detracting from the workshop, and is there anything that would improve your experience?"
              rows={4}
            />
            <TextQuestion
              name="most-value"
              label="Who have you gotten the most value from talking to?"
              rows={3}
            />
            <TextQuestion
              name="additional"
              label="Is there anything else you would like us to know?"
              rows={4}
            />
          </>
        ) : (
          <>
            {key === "overall" ? (
              <>
                <RatingScale
                  name="scale-satisfaction"
                  legend="Overall, how satisfied were you with the conference?"
                  kind="numbers"
                  minimum={0}
                  maximum={10}
                  leftLabel="Not at all"
                  rightLabel="Extremely"
                />
                <RatingScale
                  name="scale-recommend"
                  legend="How likely are you to recommend it to someone like you?"
                  kind="numbers"
                  minimum={0}
                  maximum={10}
                  leftLabel="Not at all likely"
                  rightLabel="Extremely likely"
                />
              </>
            ) : null}

            {rated.length ? (
              <section className="grid gap-6">
                <h2 className="font-display text-lg tracking-tight text-foreground">Sessions</h2>
                {rated.map((session) => (
                  <div key={session.id} className="grid gap-3 rounded-card border border-rule bg-card p-5">
                    <div>
                      <strong className="font-display text-base font-medium text-foreground">
                        {session.title}
                      </strong>
                      {session.speaker ? (
                        <span className="block text-xs text-muted">{session.speaker}</span>
                      ) : null}
                    </div>
                    <RatingScale
                      name={`rating-${session.id}`}
                      legend="How valuable was it?"
                      required={false}
                    />
                    <TextQuestion
                      name={`comment-${session.id}`}
                      label="Anything to add?"
                      rows={2}
                    />
                  </div>
                ))}
              </section>
            ) : null}

            <TextQuestion
              name="learned"
              label="One valuable thing you learned"
              required
              rows={3}
            />
            <TextQuestion
              name="additional"
              label="Anything else we should know?"
              rows={4}
            />
          </>
        )}

          <div>
            <button
              type="submit"
              className="min-h-11 rounded-card bg-accent px-7 text-sm font-semibold text-on-accent transition hover:bg-accent-hover active:scale-[0.97]"
            >
              Submit feedback
            </button>
          </div>
        </form>
      </div>
    </PortalShell>
  );
}
