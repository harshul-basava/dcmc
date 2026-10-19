import PortalShell from "@/components/dashboard/PortalShell";
import PageHeading from "@/components/dashboard/PageHeading";
import Directory from "@/components/dashboard/Directory";
import GuestDirectory from "@/components/dashboard/GuestDirectory";
import { portalPageOpen } from "@/server/portal-pages";
import { requireAdmin } from "@/server/auth";
import { getGuests, getParticipants } from "@/server/data";
import { profileComplete } from "@/server/people";

const VIEWS = [
  ["attendees", "Attendee directory"],
  ["guests", "Guest directory"],
] as const;

/**
 * Both directories exactly as attendees and guests see them: the same
 * eligibility rules and the same cards. Read-only, and separate from
 * Portal pages — looking here never opens or closes a directory for anyone.
 */
export default async function AdminDirectories({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  await requireAdmin();
  const { view: requested } = await searchParams;
  const view = requested === "guests" ? "guests" : "attendees";

  const guests = view === "guests" ? await getGuests() : [];
  const attendees = view === "attendees" ? await getParticipants() : [];
  const listed = attendees.filter(profileComplete);
  const pending = attendees.length - listed.length;
  const guestDirectoryOpen =
    view === "guests" && (await portalPageOpen("participant", "guests"));

  return (
    <PortalShell role="admin" active="directories" framed>
      <div id="directory">
        {view === "guests" ? (
          <p role="status" className="mb-6 rounded-card border border-rule bg-card p-4 text-sm text-muted">
            Organizer preview · {guestDirectoryOpen ? "Open to attendees" : "Hidden from attendees"}.
            {" "}These are the cards attendees will see when the directory opens. Viewing this preview does not release it. Bios are omitted.
          </p>
        ) : null}
        <PageHeading
          title={view === "guests" ? "Guest directory" : "Attendee directory"}
          lead={
            view === "attendees" && pending > 0
              ? `${pending} ${pending === 1 ? "attendee has" : "attendees have"} still to add a headshot and bio, so ${pending === 1 ? "is" : "are"} not shown here or to anyone else.`
              : undefined
          }
          actions={
            <nav aria-label="Directory" className="flex gap-1 rounded-card border border-rule p-1">
              {VIEWS.map(([key, label]) => (
                <a
                  key={key}
                  href={`/dashboard/admin/directories?view=${key}`}
                  aria-current={view === key ? "true" : undefined}
                  className={`rounded px-3 py-1.5 text-xs transition ${
                    view === key ? "bg-accent text-on-accent" : "text-muted hover:text-foreground"
                  }`}
                >
                  {label}
                </a>
              ))}
            </nav>
          }
        />
        {view === "guests" ? (
          <GuestDirectory guests={guests} />
        ) : (
          <Directory
            people={listed.map((p) => ({
              id: p.id,
              name: p.name,
              title: p.title,
              organization: p.organization,
              bio: p.bio,
              photo: p.photo,
              linkedin: p.linkedin,
            }))}
          />
        )}
      </div>
    </PortalShell>
  );
}
