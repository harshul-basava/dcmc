import PortalShell from "@/components/dashboard/PortalShell";
import PageHeading from "@/components/dashboard/PageHeading";
import { requireParticipant } from "@/server/auth";
import { coreReadings, furtherReadings } from "@/content/dashboard";

export default async function ReadingsPage() {
  await requireParticipant("readings");

  return (
    <PortalShell role="participant" active="readings">
      <PageHeading title="Reading list" />

      <section aria-labelledby="core">
        <h2 id="core" className="font-display text-xl tracking-tight text-foreground">
          Core readings
        </h2>

        <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {coreReadings.map((reading) => (
            <li key={reading.url}>
              <a
                href={reading.url}
                target="_blank"
                rel="noreferrer"
                className="flex h-full flex-col rounded-card border border-rule bg-card p-6 transition hover:border-border-strong"
              >
                <strong className="font-display text-xl font-normal leading-snug tracking-tight text-foreground">
                  {reading.title}
                </strong>
                <span className="mt-2 text-sm font-semibold leading-snug text-muted">
                  {reading.author}
                </span>

                {/* Pushes the takeaway to the foot of the card, so the rule
                    lines up across a row of uneven titles. */}
                <span className="mt-auto pt-8">
                  <span className="block border-t border-rule pt-5 text-sm leading-relaxed text-muted">
                    {reading.takeaway}
                  </span>
                  {reading.note ? (
                    <span className="mt-3 block text-xs leading-relaxed text-muted/80">
                      {reading.note}
                    </span>
                  ) : null}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="further" className="mt-14">
        <h2 id="further" className="font-display text-xl tracking-tight text-foreground">
          Further reading
        </h2>

        <div className="mt-5 border-t border-rule">
          {furtherReadings.map((group) => (
            <details key={group.heading} className="reading-group border-b border-rule">
              <summary>
                <span className="font-display text-lg tracking-tight text-foreground">
                  {group.heading}
                </span>
                <span aria-hidden="true" className="reading-group-marker">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M8 3.5v9M3.5 8h9" className="reading-group-plus" />
                  </svg>
                </span>
              </summary>

              <div className="pb-7">
                {group.note ? (
                  <p className="mb-5 max-w-2xl text-sm leading-relaxed text-muted">{group.note}</p>
                ) : null}

                <ul className="grid gap-3">
                  {group.items.map((item) => (
                    <li key={item.url}>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-1 rounded-card border border-rule bg-card p-5 transition hover:border-border-strong"
                      >
                        <span className="min-w-0">
                          <strong className="block font-display text-base font-medium text-foreground">
                            {item.title}
                          </strong>
                          <small className="text-xs text-muted">{item.author}</small>
                        </span>
                        <span className="max-w-sm text-xs leading-relaxed text-muted">
                          {item.takeaway}
                        </span>
                        {item.note ? (
                          <span className="w-full border-t border-rule pt-3 text-xs leading-relaxed text-muted">
                            {item.note}
                          </span>
                        ) : null}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          ))}
        </div>
      </section>
    </PortalShell>
  );
}
