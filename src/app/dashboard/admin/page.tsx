import PortalShell from "@/components/dashboard/PortalShell";
import PageHeading from "@/components/dashboard/PageHeading";
import MetricCard from "@/components/dashboard/MetricCard";
import { requireAdmin } from "@/server/auth";
import { getAssignments, getFeedback, getGuests, getParticipants, getSessions } from "@/server/data";
import { PAIRING_EXCLUDED } from "@/server/data/types";
import { ADMIN_PAGES } from "@/server/portal-pages";

export default async function AdminOverview() {
  await requireAdmin();

  const [participants, guests, sessions, assignments, feedback] = await Promise.all([
    getParticipants(),
    getGuests(),
    getSessions(),
    getAssignments(),
    getFeedback(),
  ]);

  const signedIn = [...participants, ...guests].filter((p) => p.accessCount > 0).length;
  const logins = [...participants, ...guests].reduce((sum, p) => sum + p.accessCount, 0);
  const real = assignments.filter((a) => a.group !== PAIRING_EXCLUDED);
  const published = real.filter((a) => a.state === "published").length;
  const drafts = real.filter((a) => a.state === "draft").length;

  return (
    <PortalShell role="admin" active="overview">
      <PageHeading
        title="Overview"
        actions={
          <a
            href="/dashboard/admin?refresh=1"
            className="rounded-card border border-rule px-4 py-2 text-xs text-muted transition hover:border-border-strong hover:text-foreground"
          >
            Refresh
          </a>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Participants" value={participants.length} />
        <MetricCard label="Guests" value={guests.length} />
        <MetricCard
          label="Signed in"
          value={`${signedIn} / ${participants.length + guests.length}`}
          detail={`${logins} sign-ins in total`}
        />
        <MetricCard label="Sessions" value={sessions.length} detail="Across four days" />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Published pairings" value={published} detail="Visible to participants" />
        <MetricCard label="Draft pairings" value={drafts} detail="Private until released" />
        <MetricCard label="Feedback responses" value={feedback.length} />
        <MetricCard
          label="Bios written"
          value={`${[...participants, ...guests].filter((p) => p.bio.length > 40).length} / ${
            participants.length + guests.length
          }`}
        />
      </div>

      <nav aria-label="Admin sections" className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ADMIN_PAGES.filter((page) => page.key !== "overview").map((page) => (
          <a
            key={page.key}
            href={page.path}
            className="rounded-card border border-rule bg-card p-5 transition hover:border-border-strong"
          >
            <strong className="font-display text-base font-medium text-foreground">
              {page.label}
            </strong>
          </a>
        ))}
      </nav>

      <p className="mt-10 rounded-card border border-dashed border-rule p-4 text-xs text-muted">
        Running on fixture data. Saves are lost when the server restarts.
      </p>
    </PortalShell>
  );
}
