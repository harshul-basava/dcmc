import PortalShell from "@/components/dashboard/PortalShell";
import PageHeading from "@/components/dashboard/PageHeading";
import MetricCard from "@/components/dashboard/MetricCard";
import WipNotice from "@/components/dashboard/WipNotice";
import { requireAdmin } from "@/server/auth";
import { getFeedback, getParticipants } from "@/server/data";
import { FEEDBACK_FORMS, feedbackFormOpen } from "@/server/feedback";
import { saveFeedbackAvailability } from "../actions";

function mean(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export default async function AdminFeedback({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  await requireAdmin();
  const { saved } = await searchParams;

  const [responses, participants] = await Promise.all([getFeedback(), getParticipants()]);
  const availability = await Promise.all(
    FEEDBACK_FORMS.map(async (form) => ({ ...form, open: await feedbackFormOpen(form.key) })),
  );

  const sessionRatings = responses.flatMap((r) =>
    r.sessions.map((s) => s.rating).filter((n): n is number => typeof n === "number"),
  );
  const sessionAverage = mean(sessionRatings);
  const respondents = new Set(
    responses.map((r) => r.participantId).filter(Boolean),
  ).size;

  // Per-session averages, so the weakest sessions are visible at a glance.
  const bySession = new Map<string, { title: string; ratings: number[] }>();
  for (const response of responses) {
    for (const session of response.sessions) {
      if (typeof session.rating !== "number") continue;
      if (!bySession.has(session.sessionId)) {
        bySession.set(session.sessionId, { title: session.title, ratings: [] });
      }
      bySession.get(session.sessionId)!.ratings.push(session.rating);
    }
  }

  const histogram = [1, 2, 3, 4, 5].map((score) => ({
    score,
    count: sessionRatings.filter((r) => r === score).length,
  }));
  const peak = Math.max(1, ...histogram.map((h) => h.count));

  return (
    <PortalShell role="admin" active="feedback">
      <PageHeading title="Feedback" />

      <WipNotice>
        Responses are still fixtures, and submissions are not yet written to Airtable.
        The form toggles below are live.
      </WipNotice>

      {saved ? (
        <p className="mb-6 rounded-card border border-rule bg-card p-4 text-sm text-[color:var(--color-success)]">
          Saved.
        </p>
      ) : null}

      <form action={saveFeedbackAvailability} className="mb-10 rounded-card border border-rule bg-card p-5">
        <fieldset>
          <legend className="font-display text-base text-foreground">Which forms are open</legend>
          <ul className="mt-4 flex flex-wrap gap-x-8 gap-y-3">
            {availability.map((form) => (
              <li key={form.key}>
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    name={`feedback-${form.key}`}
                    defaultChecked={form.open}
                    disabled={form.key === "anytime"}
                    className="h-4 w-4 accent-[color:var(--color-accent)]"
                  />
                  {form.label}
                  {form.key === "anytime" ? (
                    <span className="text-xs text-muted">(always open)</span>
                  ) : null}
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
        <button
          type="submit"
          className="mt-5 min-h-11 rounded-card bg-accent px-6 text-sm font-semibold text-on-accent transition hover:bg-accent-hover active:scale-[0.97]"
        >
          Save
        </button>
      </form>

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Responses" value={responses.length} />
        <MetricCard
          label="Respondents"
          value={`${respondents} / ${participants.length}`}
          detail={`${Math.round((respondents / Math.max(1, participants.length)) * 100)}% coverage`}
        />
        <MetricCard
          label="Session rating"
          value={sessionAverage ? sessionAverage.toFixed(2) : "—"}
          detail="Mean across every rated session"
        />
      </div>

      <section className="mt-10">
        <h2 className="font-display text-lg tracking-tight text-foreground">Rating spread</h2>
        <ul className="mt-4 grid gap-2">
          {histogram.map(({ score, count }) => (
            <li key={score} className="flex items-center gap-3 text-xs text-muted">
              <span className="w-4 tabular-nums">{score}</span>
              <span className="h-4 flex-1 overflow-hidden rounded-sm bg-[color:var(--neutral-100)]">
                <span
                  className="block h-full rounded-sm bg-accent"
                  style={{ width: `${(count / peak) * 100}%` }}
                />
              </span>
              <span className="w-8 text-right tabular-nums">{count}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-lg tracking-tight text-foreground">By session</h2>
        <div className="mt-4 overflow-x-auto rounded-card border border-rule bg-card">
          <table className="w-full min-w-[32rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-rule text-left">
                {["Session", "Average", "Responses"].map((head) => (
                  <th key={head} scope="col" className="px-4 py-3 text-xs font-medium uppercase tracking-[0.08em] text-muted">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...bySession.values()]
                .map((entry) => ({ ...entry, average: mean(entry.ratings) ?? 0 }))
                .sort((a, b) => a.average - b.average)
                .map((entry) => (
                  <tr key={entry.title} className="border-b border-rule last:border-0">
                    <td className="px-4 py-3 text-foreground">{entry.title}</td>
                    <td className="px-4 py-3 tabular-nums text-muted">{entry.average.toFixed(2)}</td>
                    <td className="px-4 py-3 tabular-nums text-muted">{entry.ratings.length}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-lg tracking-tight text-foreground">Responses</h2>
        <div className="mt-4 grid gap-2">
          {responses.map((response) => (
            <details key={response.id} className="rounded-card border border-rule bg-card">
              <summary className="cursor-pointer list-none px-5 py-4 text-sm text-foreground [&::-webkit-details-marker]:hidden">
                <strong className="font-medium">
                  {response.participantName || "Anonymous"}
                </strong>
                <span className="text-muted"> · {response.form}</span>
              </summary>
              <div className="grid gap-3 border-t border-rule px-5 py-4 text-sm">
                {Object.entries(response.answers)
                  .filter(([, value]) => value.trim())
                  .map(([question, value]) => (
                    <p key={question}>
                      <span className="block text-xs uppercase tracking-[0.08em] text-muted">
                        {question}
                      </span>
                      <span className="text-foreground">{value}</span>
                    </p>
                  ))}
              </div>
            </details>
          ))}
        </div>
      </section>
    </PortalShell>
  );
}
