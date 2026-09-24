import PortalShell from "@/components/dashboard/PortalShell";
import PageHeading from "@/components/dashboard/PageHeading";
import HandbookBack from "@/components/dashboard/HandbookBack";
import { redirect } from "next/navigation";
import { requireParticipant } from "@/server/auth";
import { handbookResourcesOpen } from "@/server/portal-pages";
import { ComingSoon } from "@/components/ui";
import { resourceGroups } from "@/content/dashboard";

export default async function ResourcesPage() {
  await requireParticipant("handbook");
  // Closing the section must refuse a direct request, not just hide the link.
  if (!(await handbookResourcesOpen())) redirect("/dashboard/handbook");

  return (
    <PortalShell role="participant" active="handbook" framed={false}>
      <HandbookBack />
      <PageHeading title="Conference resources" />

      {resourceGroups.length > 1 ? (
        <nav aria-label="Jump to a section" className="mb-10 flex flex-wrap gap-2">
          {resourceGroups.map((group) => (
            <a
              key={group.id}
              href={`#${group.id}`}
              className="rounded-full border border-rule px-3 py-1.5 text-xs text-muted transition hover:border-border-strong hover:text-foreground"
            >
              {group.heading}
            </a>
          ))}
        </nav>
      ) : null}

      {resourceGroups.length === 0 ? (
        <ComingSoon>Resources will be posted here before the conference.</ComingSoon>
      ) : null}

      <div className="grid gap-10">
        {resourceGroups.map((group) => (
          <section key={group.id} id={group.id} className="scroll-mt-24">
            <h2 className="font-display text-xl tracking-tight text-foreground">{group.heading}</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {group.items.map((item) => (
                <li key={item.url}>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block h-full rounded-card border border-rule bg-card p-5 transition hover:border-border-strong"
                  >
                    <strong className="block font-display text-base font-medium text-foreground">
                      {item.title}
                    </strong>
                    <small className="text-xs text-muted">{item.author}</small>
                    <p className="mt-2 text-xs leading-relaxed text-muted">{item.takeaway}</p>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </PortalShell>
  );
}
