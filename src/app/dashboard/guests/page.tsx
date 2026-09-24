import PortalShell from "@/components/dashboard/PortalShell";
import PageHeading from "@/components/dashboard/PageHeading";
import Directory from "@/components/dashboard/Directory";
import { requireParticipant } from "@/server/auth";
import { getGuests } from "@/server/data";
import { profileComplete } from "@/server/people";

export default async function GuestDirectoryPage() {
  await requireParticipant("guests");
  const everyone = await getGuests();
  // Same rule as the attendee directory: a card with no headshot and no bio
  // tells a participant nothing, so it waits until there is something to read.
  const guests = everyone.filter(profileComplete);
  const pending = everyone.length - guests.length;

  return (
    <PortalShell role="participant" active="guests">
      <div id="guests">
        <PageHeading
          title="Guest directory"
          lead={
            pending > 0
              ? `${pending} ${pending === 1 ? "guest has" : "guests have"} still to add a headshot and bio. Profiles appear here once both are done.`
              : undefined
          }
        />
        <Directory
          people={guests.map((g) => ({
            id: g.id,
            name: g.name,
            title: g.title,
            organization: g.organization,
            bio: g.bio,
            photo: g.photo,
            linkedin: g.linkedin,
          }))}
          anchor="#guests"
        />
      </div>
    </PortalShell>
  );
}
