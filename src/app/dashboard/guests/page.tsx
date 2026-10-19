import PortalShell from "@/components/dashboard/PortalShell";
import PageHeading from "@/components/dashboard/PageHeading";
import GuestDirectory from "@/components/dashboard/GuestDirectory";
import { requireParticipant } from "@/server/auth";
import { getGuests } from "@/server/data";

export default async function GuestDirectoryPage() {
  await requireParticipant("guests");
  const guests = (await getGuests()).filter((guest) => !guest.hidden);

  return (
    <PortalShell role="participant" active="guests">
      <div id="guests">
        <PageHeading title="Guest directory" />
        <GuestDirectory guests={guests} />
      </div>
    </PortalShell>
  );
}
