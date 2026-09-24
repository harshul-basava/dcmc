import PortalShell from "@/components/dashboard/PortalShell";
import PageHeading from "@/components/dashboard/PageHeading";
import Directory from "@/components/dashboard/Directory";
import { requireDirectoryViewer } from "@/server/auth";
import { getParticipants } from "@/server/data";
import { profileComplete } from "@/server/people";

export default async function DirectoryPage() {
  const session = await requireDirectoryViewer();
  const everyone = await getParticipants();
  // Held back until someone has both a headshot and a bio; a wall of blank
  // plates and empty profiles is worse than a shorter directory.
  const participants = everyone.filter(profileComplete);
  const pending = everyone.length - participants.length;

  return (
    <PortalShell role={session.role} active="directory">
      <div id="directory">
        <PageHeading
          title="Attendee directory"
          lead={
            pending > 0
              ? `${pending} ${pending === 1 ? "attendee has" : "attendees have"} still to add a headshot and bio. Profiles appear here once both are done.`
              : undefined
          }
        />
        <Directory
          people={participants.map((p) => ({
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
