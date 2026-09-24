import PortalShell from "@/components/dashboard/PortalShell";
import PageHeading from "@/components/dashboard/PageHeading";
import WipNotice from "@/components/dashboard/WipNotice";
import { requireAdmin } from "@/server/auth";
import { getAssignments, getSessions } from "@/server/data";
import { PAIRING_EXCLUDED } from "@/server/data/types";
import { personLookup } from "@/server/people";
import { formatRange, minutesOf } from "@/server/schedule";
import { generatePairings, hidePairings, publishPairings } from "../actions";

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

  const blocks = sessions.filter((s) => s.personalized);

  return (
    <PortalShell role="admin" active="pairings">
      <PageHeading
        title="Pairings"
        lead="Drafts stay private. Participants see a block only once it is released."
      />

      <WipNotice>
        Generation and release work against the fixture roster, not the live Airtable
        attendees. Treat anything here as a preview.
      </WipNotice>

      {flags.error ? (
        <p role="alert" className="mb-6 rounded-card border border-accent bg-[color:var(--red-50)] p-4 text-sm text-accent">
          Nothing to do — generate a draft first.
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

      <div className="grid gap-6">
        {blocks.map((session) => {
          const rows = assignments.filter(
            (a) => a.sessionId === session.id && a.group !== PAIRING_EXCLUDED,
          );
          const draft = rows.filter((a) => a.state === "draft");
          const published = rows.filter((a) => a.state === "published");

          // Group the draft so it reads as pairs and groups, not a list of rows.
          const groups = new Map<string, string[]>();
          for (const row of draft) {
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
                  {session.type === "small-group" ? (
                    <label className="grid gap-1 text-xs text-muted">
                      Group size
                      <input
                        type="number"
                        name="size"
                        min={2}
                        max={12}
                        defaultValue={5}
                        className="w-20 rounded-card border border-rule bg-surface px-2 py-1.5 text-sm text-foreground"
                      />
                    </label>
                  ) : null}
                  <button
                    type="submit"
                    className="min-h-10 rounded-card border border-rule px-4 text-xs text-foreground transition hover:border-border-strong"
                  >
                    Generate draft
                  </button>
                </form>

                <form action={publishPairings}>
                  <input type="hidden" name="sessionId" value={session.id} />
                  <button
                    type="submit"
                    className="min-h-10 rounded-card bg-accent px-4 text-xs font-semibold text-on-accent transition hover:bg-accent-hover"
                  >
                    {published.length ? "Update live pairings" : "Release"}
                  </button>
                </form>

                {published.length ? (
                  <form action={hidePairings}>
                    <input type="hidden" name="sessionId" value={session.id} />
                    <button
                      type="submit"
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
                    Read the draft ({groups.size} {session.type === "small-group" ? "groups" : "pairs"})
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
                <p className="mt-5 text-xs text-muted">No draft yet.</p>
              )}
            </section>
          );
        })}
      </div>
    </PortalShell>
  );
}
