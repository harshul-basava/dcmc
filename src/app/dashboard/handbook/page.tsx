import PortalShell from "@/components/dashboard/PortalShell";
import PageHeading from "@/components/dashboard/PageHeading";
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
    <PortalShell role="participant" active="handbook" framed={false}>
      <PageHeading title="Handbook" />

      <ul className="grid gap-3 sm:grid-cols-2">
        {links.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              className="block h-full rounded-card border border-rule bg-card p-6 transition hover:border-border-strong"
            >
              <strong className="font-display text-base font-medium text-foreground">
                {link.title}
              </strong>
              <p className="mt-2 text-sm leading-relaxed text-muted">{link.body}</p>
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
