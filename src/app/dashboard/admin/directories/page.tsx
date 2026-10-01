import PortalShell from "@/components/dashboard/PortalShell";
import PageHeading from "@/components/dashboard/PageHeading";
import Directory from "@/components/dashboard/Directory";
import { requireAdmin } from "@/server/auth";
import { getGuests, getParticipants } from "@/server/data";
import { profileComplete } from "@/server/people";

const VIEWS = [
  ["attendees", "Attendee directory"],
  ["guests", "Guest directory"],
] as const;

/**
 * Both directories exactly as attendees and guests see them: the same
 * complete-profiles-only rule and the same cards. Read-only, and separate from
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

  const everyone = view === "guests" ? await getGuests() : await getParticipants();
  const listed = everyone.filter(profileComplete);
  const pending = everyone.length - listed.length;
  const noun = view === "guests" ? "guest" : "attendee";

  return (
    <PortalShell role="admin" active="directories" framed>
      <div id="directory">
        <PageHeading
          title={view === "guests" ? "Guest directory" : "Attendee directory"}
          lead={
            pending > 0
              ? `${pending} ${pending === 1 ? `${noun} has` : `${noun}s have`} still to add a headshot and bio, so ${pending === 1 ? "is" : "are"} not shown here or to anyone else.`
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
          anchor="#directory"
        />
      </div>
    </PortalShell>
  );
}
