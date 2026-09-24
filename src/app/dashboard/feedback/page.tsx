import PortalShell from "@/components/dashboard/PortalShell";
import PageHeading from "@/components/dashboard/PageHeading";
import TextQuestion from "@/components/dashboard/TextQuestion";
import { requireParticipant } from "@/server/auth";
import { FEEDBACK_FORMS, completedForms, feedbackFormOpen } from "@/server/feedback";
import { submitFeedback } from "./actions";

export default async function FeedbackIndex({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const me = await requireParticipant("feedback");
  const { saved, error } = await searchParams;
  const done = await completedForms(me.id);

  // Anytime is embedded alongside rather than linked to, so it is not a card.
  const linked = await Promise.all(
    FEEDBACK_FORMS.filter((form) => form.key !== "anytime").map(async (form) => ({
      ...form,
      open: await feedbackFormOpen(form.key),
    })),
  );

  const anytime = FEEDBACK_FORMS.find((form) => form.key === "anytime")!;

  return (
    <PortalShell role="participant" active="feedback">
      <PageHeading title="Feedback" />

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
        {/* The dated forms, stacked. */}
        <ul className="grid content-start gap-3">
          {linked.map((form) => {
            const completed = done.has(form.key);

            if (!form.open) {
              return (
                <li
                  key={form.key}
                  className="flex min-h-20 flex-col justify-between rounded-card border border-dashed border-rule p-4 opacity-60"
                >
                  <span className="font-display text-base text-foreground">{form.label}</span>
                  <span className="mt-3 flex items-baseline justify-between gap-3">
                    <small className="text-xs leading-snug text-muted">{form.description}</small>
                    <small className="shrink-0 text-xs text-muted">Opens later</small>
                  </span>
                </li>
              );
            }

            return (
              <li key={form.key}>
                <a
                  href={`/dashboard/feedback/${form.key}`}
                  className="flex min-h-20 flex-col justify-between rounded-card border border-rule bg-card p-4 transition hover:border-border-strong"
                >
                  <span className="flex items-start justify-between gap-3">
                    <strong className="font-display text-base font-medium text-foreground">
                      {form.label}
                    </strong>
                    <Chevron />
                  </span>
                  <span className="mt-3 flex items-baseline justify-between gap-3">
                    <small className="text-xs leading-snug text-muted">{form.description}</small>
                    {completed ? (
                      <span className="shrink-0 text-xs text-[color:var(--color-success)]">
                        ✓ Done
                      </span>
                    ) : null}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>

        <section aria-labelledby="anytime">
          <h2 id="anytime" className="font-display text-2xl tracking-tight text-foreground">
            {anytime.title}
          </h2>
          <p className="mt-2 text-sm text-muted">{anytime.description}</p>

          {saved ? (
            <p className="mt-5 rounded-card border border-rule bg-card p-3 text-sm text-[color:var(--color-success)]">
              Thank you — your comment was saved.
            </p>
          ) : null}

          {error ? (
            <p
              role="alert"
              className="mt-5 rounded-card border border-accent bg-[color:var(--red-50)] p-3 text-sm text-accent"
            >
              Please write something before submitting.
            </p>
          ) : null}

          <form action={submitFeedback} className="mt-5 grid gap-5">
            <input type="hidden" name="form" value="anytime" />

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

            <div>
              <button
                type="submit"
                className="min-h-11 rounded-card bg-accent px-7 text-sm font-semibold text-on-accent transition hover:bg-accent-hover active:scale-[0.97]"
              >
                Submit feedback
              </button>
            </div>
          </form>
        </section>
      </div>
    </PortalShell>
  );
}

function Chevron() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-1 shrink-0 text-muted"
    >
      <path d="M6 3l5 5-5 5" />
    </svg>
  );
}
