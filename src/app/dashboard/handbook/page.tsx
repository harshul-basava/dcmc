import PortalShell from "@/components/dashboard/PortalShell";
import { requireParticipant } from "@/server/auth";
import { conference } from "@/content/site";
import { handbookLinks } from "@/content/dashboard";
import { handbookResourcesOpen } from "@/server/portal-pages";

export default async function HandbookPage() {
  await requireParticipant("handbook");
  const resourcesOpen = await handbookResourcesOpen();
  const links = handbookLinks.filter(
    (link) => resourcesOpen || link.href !== "/dashboard/handbook/resources",
  );

  return (
    <PortalShell role="participant" active="handbook">
      <h1 className="mb-6 font-display text-3xl font-normal tracking-[-0.02em] text-foreground">
        Attendee handbook
      </h1>

      {/* One card per line rather than a two-column grid: the entries are a
          list to read down, and their descriptions are long enough that two
          columns cramp them. */}
      <ul className="grid gap-3">
        {links.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              className="block rounded-card border border-rule bg-surface px-6 py-5 transition hover:border-border-strong"
            >
              <strong className="font-display text-lg font-medium tracking-tight text-foreground">
                {link.title}
              </strong>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{link.body}</p>
            </a>
          </li>
        ))}
      </ul>

      <section className="mt-10 rounded-card border border-rule bg-card p-6">
        <h2 className="font-display text-lg tracking-tight text-foreground">Getting help</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          For anything urgent during the conference, or anything you would rather raise
          privately, write to{" "}
          <a href={`mailto:${conference.email}`} className="text-accent underline underline-offset-2">
            {conference.email}
          </a>
          .
        </p>
      </section>
    </PortalShell>
  );
}
