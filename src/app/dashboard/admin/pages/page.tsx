import { Fragment } from "react";
import PortalShell from "@/components/dashboard/PortalShell";
import PageHeading from "@/components/dashboard/PageHeading";
import { requireAdmin } from "@/server/auth";
import { PORTAL_PAGES, portalPageState } from "@/server/portal-pages";
import { HANDBOOK_RESOURCES_KEY, handbookResourcesOpen } from "@/server/portal-pages";
import { FEEDBACK_FORMS, feedbackFormOpen } from "@/server/feedback";
import { savePortalPages } from "../actions";

const AUDIENCES = [
  { role: "participant" as const, label: "Attendees" },
  { role: "guest" as const, label: "Guests" },
];

export default async function AdminPortalPages({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  await requireAdmin();
  const { saved } = await searchParams;
  const [state, resourcesOpen, forms] = await Promise.all([
    portalPageState(),
    handbookResourcesOpen(),
    // Anytime never closes, so it is not offered as a toggle.
    Promise.all(
      FEEDBACK_FORMS.filter((form) => form.key !== "anytime").map(async (form) => ({
        ...form,
        open: await feedbackFormOpen(form.key),
      })),
    ),
  ]);

  return (
    <PortalShell role="admin" active="pages">
      <PageHeading
        title="Portal pages"
        lead="A closed page leaves the audience's navigation, and direct requests to it are redirected."
        actions={
          <a
            href="/dashboard/admin/pages?refresh=1"
            className="inline-flex min-h-10 items-center gap-2 rounded-card border border-rule bg-card px-4 text-xs text-foreground transition hover:border-border-strong"
          >
            <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
              <path d="M15.5 6.5A6 6 0 1 0 16 13M15.5 6.5V3m0 3.5H12" />
            </svg>
            Refresh
          </a>
        }
      />

      {saved ? (
        <p className="mb-6 rounded-card border border-rule bg-card p-4 text-sm text-[color:var(--color-success)]">
          Saved.
        </p>
      ) : null}

      <form action={savePortalPages}>
        <div className="grid items-start gap-6 lg:grid-cols-2">
          {AUDIENCES.map(({ role, label }) => {
            const pages = PORTAL_PAGES.filter((page) => page.role === role);
            const open = pages.filter((page) => state.get(`${role}:${page.key}`)).length;
            // Whichever open page comes first is where this audience lands.
            const home = pages.find((page) => state.get(`${role}:${page.key}`))?.key;

            return (
              <section key={role} className="portal-pages-card">
                <header className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-display text-xl tracking-tight text-foreground">{label}</h2>
                    <p className="mt-1 text-sm text-muted">
                      Choose which pages this group can open.
                    </p>
                  </div>
                  <span className="portal-pages-count">
                    {open} of {pages.length}
                  </span>
                </header>

                {pages.map((page) => (
                  <Fragment key={page.key}>
                    <div className="portal-pages-row">
                      <span className="flex items-center gap-2.5">
                        <span className="font-display text-base font-medium text-foreground">
                          {page.label}
                        </span>
                        {page.key === home ? <span className="portal-pages-home">Home</span> : null}
                      </span>

                      <label className="switch">
                        <input
                          type="checkbox"
                          name={`page-${role}:${page.key}`}
                          defaultChecked={state.get(`${role}:${page.key}`)}
                        />
                        <span className="switch-track" />
                        <span className="sr-only">{`${page.label} open to ${label.toLowerCase()}`}</span>
                      </label>
                    </div>

                    {/* The individual forms live behind the Feedback page, so
                        they are nested under it rather than given a card of
                        their own. Closing the page closes all of them. */}
                    {role === "participant" && page.key === "feedback"
                      ? forms.map((form) => (
                          <div
                            key={form.key}
                            className="portal-pages-row is-sub"
                            data-disabled={!state.get("participant:feedback")}
                          >
                            <span>
                              <span className="block text-sm font-medium text-foreground">
                                {form.title}
                              </span>
                              <small className="text-xs text-muted">{form.description}</small>
                            </span>

                            <label className="switch">
                              <input
                                type="checkbox"
                                name={`feedback-${form.key}`}
                                defaultChecked={form.open}
                              />
                              <span className="switch-track" />
                              <span className="sr-only">{`${form.title} open to attendees`}</span>
                            </label>
                          </div>
                        ))
                      : null}
                  </Fragment>
                ))}

                {/* Not a nav page — a section inside the handbook — so it sits
                    apart on the card's foot. */}
                {role === "participant" ? (
                  <div className="portal-pages-row is-feature">
                    <span>
                      <span className="block font-display text-base font-medium text-foreground">
                        Conference resources
                      </span>
                      <small className="text-xs text-muted">Shown inside the handbook</small>
                    </span>

                    <span className="flex items-center gap-3">
                      <label className="switch">
                        <input
                          type="checkbox"
                          name={`feature-${HANDBOOK_RESOURCES_KEY}`}
                          defaultChecked={resourcesOpen}
                        />
                        <span className="switch-track" />
                        <span className="sr-only">Conference resources open to attendees</span>
                      </label>
                    </span>
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            className="min-h-11 rounded-card bg-accent px-7 text-sm font-semibold text-on-accent transition hover:bg-accent-hover active:scale-[0.97]"
          >
            Save changes
          </button>
        </div>
      </form>
    </PortalShell>
  );
}
