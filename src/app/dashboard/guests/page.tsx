import PortalShell from "@/components/dashboard/PortalShell";
import PageHeading from "@/components/dashboard/PageHeading";
import Directory from "@/components/dashboard/Directory";
import { requireParticipant } from "@/server/auth";
import { getGuests } from "@/server/data";

export default async function GuestDirectoryPage() {
  await requireParticipant("guests");
  const guests = await getGuests();

  return (
    <PortalShell role="participant" active="guests">
      <div id="guests">
        <PageHeading title="Guest directory" />
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
