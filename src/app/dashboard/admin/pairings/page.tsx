import PortalShell from "@/components/dashboard/PortalShell";
import PageHeading from "@/components/dashboard/PageHeading";
import WipNotice from "@/components/dashboard/WipNotice";
import { requireAdmin } from "@/server/auth";
import { getAssignments, getSessions } from "@/server/data";
import { PAIRING_EXCLUDED } from "@/server/data/types";
import { personLookup } from "@/server/people";
import { formatRange, minutesOf } from "@/server/schedule";
import { generatePairings, hidePairings, publishPairings } from "../actions";
import { airtableConfigured, ASSIGNMENTS_TABLE } from "@/server/airtable";

export default async function AdminPairings({
  searchParams,
}: {
  searchParams: Promise<{ generated?: string; published?: string; hidden?: string; error?: string }>;
}) {
  await requireAdmin();
  const flags = await searchParams;

  const [sessions, assignments, people] = await Promise.all([
    getSessions(),
    getAssignments(),
    personLookup(),
  ]);

  const blocks = sessions.filter((s) => s.type === "one-to-one");
  const storageReady = !airtableConfigured() || Boolean(ASSIGNMENTS_TABLE);

  return (
    <PortalShell role="admin" active="pairings">
      <PageHeading
        title="Pairings"
        lead="Generate two conversations per 1:1 block, review the draft, then release it to attendee schedules. Guests are included only during their submitted availability."
      />

      {airtableConfigured() && !ASSIGNMENTS_TABLE ? <WipNotice>Pairing storage needs to be connected before drafts can be saved or released.</WipNotice> : null}

      {flags.error ? (
        <p role="alert" className="mb-6 rounded-card border border-accent bg-[color:var(--red-50)] p-4 text-sm text-accent">
          {flags.error === "roster" ? "No pairs could be made. Check the roster and guest availability." : flags.error === "session" ? "Choose a 1:1 session from the schedule." : "Generate a draft before releasing pairings."}
        </p>
      ) : null}
      {flags.published ? (
        <p className="mb-6 rounded-card border border-rule bg-card p-4 text-sm text-[color:var(--color-success)]">
          Released. That block is now on participant schedules.
        </p>
      ) : null}
      {flags.hidden ? (
        <p className="mb-6 rounded-card border border-rule bg-card p-4 text-sm text-muted">
          Hidden from participant schedules. The draft is untouched.
        </p>
      ) : null}

      {flags.generated ? <p role="status" className="mb-6 text-sm text-muted">Draft saved. Review the pairs below before releasing.</p> : null}
      {!blocks.length ? <p className="text-sm text-muted">No 1:1 blocks yet. Add a session with type “1:1s” on the <a href="/dashboard/admin/schedule" className="text-accent underline">schedule</a> to generate pairings.</p> : null}
      <div className="grid gap-6">
        {blocks.map((session) => {
          const rows = assignments.filter(
            (a) => a.sessionId === session.id && a.group !== PAIRING_EXCLUDED,
          );
          const draft = rows.filter((a) => a.state === "draft");
          const published = rows.filter((a) => a.state === "published");

          // Group the draft so it reads as pairs and groups, not a list of rows.
          const groups = new Map<string, string[]>();
          for (const row of (draft.length ? draft : published)) {
            if (!groups.has(row.group)) groups.set(row.group, []);
            groups.get(row.group)!.push(people.get(row.personKey)?.name ?? row.personKey);
          }

          return (
            <section key={session.id} className="rounded-card border border-rule bg-card p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <div>
                  <h2 className="font-display text-lg tracking-tight text-foreground">
                    {session.title}
                  </h2>
                  <p className="text-xs text-muted">
                    {new Date(`${session.day}T12:00:00Z`).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                      timeZone: "UTC",
                    })}{" "}
                    · {formatRange(minutesOf(session.start), minutesOf(session.end))}
                  </p>
                </div>

                <p className="text-xs">
                  {published.length ? (
                    <span className="text-[color:var(--color-success)]">
                      Live · {published.length} places
                    </span>
                  ) : (
                    <span className="text-muted">Not released</span>
                  )}
                  <span className="text-muted"> · {draft.length} in draft</span>
                </p>
              </div>

              <div className="mt-5 flex flex-wrap items-end gap-3">
                <form action={generatePairings} className="flex items-end gap-2">
                  <input type="hidden" name="sessionId" value={session.id} />
                  <button
                    type="submit"
                    disabled={!storageReady}
                    className="min-h-10 rounded-card border border-rule px-4 text-xs text-foreground transition hover:border-border-strong disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Generate draft
                  </button>
                </form>

                <form action={publishPairings}>
                  <input type="hidden" name="sessionId" value={session.id} />
                  <button
                    type="submit"
                    disabled={!storageReady || !draft.length}
                    className="min-h-10 rounded-card bg-accent px-4 text-xs font-semibold text-on-accent transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {published.length ? "Update live pairings" : "Release"}
                  </button>
                </form>

                {published.length ? (
                  <form action={hidePairings}>
                    <input type="hidden" name="sessionId" value={session.id} />
                    <button
                      type="submit"
                      disabled={!storageReady}
                      className="min-h-10 rounded-card px-4 text-xs text-muted underline underline-offset-2 transition hover:text-accent"
                    >
                      Hide
                    </button>
                  </form>
                ) : null}
              </div>

              {groups.size ? (
                <details className="mt-5">
                  <summary className="cursor-pointer text-xs text-muted">
                    {draft.length ? "Read the draft" : "Read live pairings"} ({groups.size} pairs)
                  </summary>
                  <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
                    {[...groups.entries()].map(([group, names]) => (
                      <li key={group} className="text-xs text-muted">
                        <strong className="font-medium text-foreground">{group}</strong> —{" "}
                        {names.join(", ")}
                      </li>
                    ))}
                  </ul>
                </details>
              ) : (
                <p className="mt-5 text-xs text-muted">No pairings yet. Each round may leave one person unpaired if its roster is odd.</p>
              )}
            </section>
          );
        })}
      </div>
    </PortalShell>
  );
}
