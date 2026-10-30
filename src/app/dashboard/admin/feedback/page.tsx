import Link from "next/link";
import { TEST_PARTICIPANT_ID, isTestParticipant, testAttendeePassword } from "@/server/test-attendee";
import { FEEDBACK_TABLE } from "@/server/airtable";
import PortalShell from "@/components/dashboard/PortalShell";
import PageHeading from "@/components/dashboard/PageHeading";
import { FEEDBACK_FORMS } from "@/server/feedback";
import { startLiveTest, startPreview } from "../actions";
import MetricCard from "@/components/dashboard/MetricCard";
import { requireAdmin } from "@/server/auth";
import { getFeedback, getParticipants } from "@/server/data";

/** `2026-10-23T14:05:00Z` -> `23 Oct, 14:05`. */
function formatWhen(value: string): string {
  const when = new Date(value);
  if (Number.isNaN(when.getTime())) return value;
  return when.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/New_York",
  });
}

function mean(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export default async function AdminFeedback({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; oneToOnes?: string }>;
}) {
  await requireAdmin();
  const { saved, oneToOnes } = await searchParams;
  const showOneToOnes = oneToOnes !== "hidden";

  const [allResponses, participants] = await Promise.all([getFeedback({ includeTests: true }), getParticipants()]);
  const testResponses = allResponses.filter((response) => response.isTest || isTestParticipant(response.participantId));
  const responses = allResponses.filter((response) => !response.isTest && !isTestParticipant(response.participantId));
  const testPassword = testAttendeePassword();

  // The running log, newest first, kept out of the one-per-person list below.
  const anytime = responses
    .filter((response) => response.form === "anytime" && Object.values(response.answers).some((value) => value.trim()))
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

  const visibleSessions = responses.flatMap((response) => response.sessions).filter(
    (session) => showOneToOnes || !session.sessionId.startsWith("conv-"),
  );
  const sessionRatings = visibleSessions
    .map((session) => session.rating).filter((n): n is number => typeof n === "number");
  const ratingToggleParams = new URLSearchParams(
    { oneToOnes: showOneToOnes ? "hidden" : "visible" },
  );
  if (saved) ratingToggleParams.set("saved", saved);
  const sessionAverage = mean(sessionRatings);
  const respondents = new Set(
    responses.map((r) => r.participantId).filter(Boolean),
  ).size;

  // Per-session averages, so the weakest sessions are visible at a glance.
  const bySession = new Map<string, { title: string; ratings: number[] }>();
  for (const session of visibleSessions) {
    if (typeof session.rating !== "number") continue;
    if (!bySession.has(session.sessionId)) {
      bySession.set(session.sessionId, { title: session.title, ratings: [] });
    }
    bySession.get(session.sessionId)!.ratings.push(session.rating);
  }

  const histogram = [1, 2, 3, 4, 5].map((score) => ({
    score,
    count: sessionRatings.filter((r) => r === score).length,
  }));
  const peak = Math.max(1, ...histogram.map((h) => h.count));

  return (
    <PortalShell role="admin" active="feedback">
      <PageHeading title="Feedback" actions={<a href="/dashboard/admin/feedback/questions" className="inline-flex min-h-10 items-center rounded-card bg-accent px-4 text-xs font-semibold text-on-accent">Edit questions</a>} />

      <section className="mb-8 rounded-card border border-rule bg-card p-5" aria-labelledby="live-test-attendee">
        <h2 id="live-test-attendee" className="font-display text-lg text-foreground">Live test attendee</h2>
        <p className="mt-2 text-sm text-muted">Use this account to submit real test feedback to Airtable. All attendee pages and forms are open. The account and its responses are excluded from attendee counts, directories, login statistics, and pairing requests.</p>
        {testPassword ? <>
          <p className="mt-4 text-sm text-foreground">Password: <code className="select-all rounded bg-surface px-2 py-1">{testPassword}</code></p>
          <p className="mt-2 text-xs text-muted">Use the normal dashboard sign-in page in a private window to test signing in with this password, or switch accounts below.</p>
          <form action={startLiveTest} className="mt-4"><button type="submit" className="min-h-11 rounded-card bg-accent px-5 text-sm font-semibold text-on-accent">Use live test attendee</button></form>
        </> : <p role="alert" className="mt-4 text-sm text-accent">Configure the dashboard session secret to enable the live test account.</p>}
        <p className="mt-4 text-xs text-muted">Test identity: {TEST_PARTICIPANT_ID}</p>
        <h3 className="mt-6 font-display text-base text-foreground">Saved test submissions</h3>
        {!testResponses.length ? <p className="mt-2 text-sm text-muted">No saved test submissions yet.</p> : <div className="mt-3 grid gap-3">
          {testResponses.map((response) => <details key={response.id} className="rounded-card border border-rule p-4">
            <summary className="cursor-pointer text-sm text-foreground">TEST · {response.form} · {formatWhen(response.submittedAt)}</summary>
            <a href={`https://airtable.com/${process.env.AIRTABLE_BASE_ID || "appZ3PpQjBx0UzJ3u"}/${FEEDBACK_TABLE}/${response.id}`} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-accent underline">View record in Airtable</a>
            <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words text-xs text-muted">{JSON.stringify({ answers: response.answers, ratings: response.ratings, sessions: response.sessions }, null, 2)}</pre>
          </details>)}
        </div>}
      </section>

      <section className="mb-8 rounded-card border border-rule bg-card p-5" aria-labelledby="test-feedback">
        <h2 id="test-feedback" className="font-display text-lg text-foreground">Test feedback</h2>
        <p className="mt-2 text-sm text-muted">Try any form, including closed forms, as an attendee. Test submissions check required answers without saving feedback or changing pairing requests.</p>
        <form action={startPreview} className="mt-4 flex flex-wrap items-end gap-4">
          <label className="grid gap-1 text-xs text-muted">Attendee
            <select name="id" required className="min-h-11 rounded-card border border-rule bg-surface px-3 text-sm text-foreground" defaultValue="">
              <option value="" disabled>Choose an attendee</option>
              {participants.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-xs text-muted">Form
            <select name="feedback" className="min-h-11 rounded-card border border-rule bg-surface px-3 text-sm text-foreground" defaultValue="overall">
              {FEEDBACK_FORMS.map((form) => <option key={form.key} value={form.key}>{form.title}</option>)}
            </select>
          </label>
          <button type="submit" disabled={!participants.length} className="min-h-11 rounded-card bg-accent px-5 text-sm font-semibold text-on-accent disabled:opacity-50">Test form</button>
        </form>
        {!participants.length ? <p className="mt-3 text-sm text-muted">Add an attendee to test personalized feedback.</p> : null}
      </section>

      <p className="mb-6 text-sm text-muted">Charts below count only session ratings from the overall form.</p>

      <section className="mb-10">
        <h2 className="font-display text-lg tracking-tight text-foreground">
          Anytime feedback
        </h2>
        <p className="mt-1 text-sm text-muted">
          Submitted whenever someone has something to say, and never closed. Newest first.
        </p>

        {anytime.length ? (
          <ul className="mt-4 grid gap-2">
            {anytime.map((response) => (
              <li key={response.id} className="rounded-card border border-rule bg-card p-5">
                {Object.entries(response.answers).filter(([, value]) => value.trim()).map(([key, value]) => (
                  <p key={key} className="mb-2 text-sm leading-relaxed text-foreground">
                    <strong className="mr-2 font-medium">{response.questionLabels?.[key] ?? key}:</strong>{value}
                  </p>
                ))}
                <p className="mt-3 text-xs text-muted">
                  {response.participantName || "Anonymous"}
                  {response.submittedAt ? ` · ${formatWhen(response.submittedAt)}` : ""}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 rounded-card border border-dashed border-rule px-6 py-10 text-center text-sm text-muted">
            Nothing yet. Anytime responses appear here as they come in.
          </p>
        )}
      </section>

      {saved ? (
        <p className="mb-6 rounded-card border border-rule bg-card p-4 text-sm text-[color:var(--color-success)]">
          Saved.
        </p>
      ) : null}

      {/* Which forms are open now lives on Portal pages, nested under the
          Feedback page toggle it depends on. */}
      <p className="mb-10 text-sm text-muted">
        Open and close individual forms on{" "}
        <a
          href="/dashboard/admin/pages"
          className="text-accent underline underline-offset-2"
        >
          Portal pages
        </a>
        .
      </p>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg tracking-tight text-foreground">Session ratings</h2>
        <Link
          href={`/dashboard/admin/feedback?${ratingToggleParams}`}
          scroll={false}
          className="inline-flex min-h-11 items-center rounded-card border border-rule bg-card px-4 text-sm font-medium text-foreground hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {showOneToOnes ? "Hide 1-1s" : "Show 1-1s"}
        </Link>
      </div>
      <p className="mb-4 text-sm text-muted">
        {showOneToOnes ? "Including 1-1s" : "Excluding 1-1s"} in the session average, rating spread, and session table.
      </p>
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
          detail={showOneToOnes ? "Mean across every rated session" : "Mean across rated sessions, excluding 1-1s"}
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
              {!bySession.size ? <tr><td colSpan={3} className="px-4 py-6 text-center text-muted">No session ratings{showOneToOnes ? " yet" : " with 1-1s hidden"}.</td></tr> : null}
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
                        {response.questionLabels?.[question] ?? question}
                      </span>
                      <span className="text-foreground">{value}</span>
                    </p>
                  ))}
                {Object.entries(response.ratings).map(([question, value]) => (
                  <p key={question}>
                    <span className="block text-xs uppercase tracking-[0.08em] text-muted">
                      {response.questionLabels?.[`scale-${question}`] ?? response.questionLabels?.[question] ?? question}
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
