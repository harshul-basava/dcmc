import PortalShell from "@/components/dashboard/PortalShell";
import PageHeading from "@/components/dashboard/PageHeading";
import ScheduleLegend from "@/components/dashboard/ScheduleLegend";
import SchedulePanel from "@/components/dashboard/SchedulePanel";
import { requireParticipant } from "@/server/auth";
import { getAssignments, getSessions } from "@/server/data";
import { personLookup } from "@/server/people";
import { buildSchedule } from "@/server/schedule";

export default async function SchedulePage() {
  const me = await requireParticipant("schedule");

  const [sessions, assignments, people] = await Promise.all([
    getSessions(),
    getAssignments(),
    personLookup(),
  ]);

  const days = buildSchedule({
    sessions,
    assignments,
    people,
    viewerKey: `participant:${me.id}`,
  });

  return (
    <PortalShell role="participant" active="schedule">
      <div id="schedule">
        <PageHeading title={`Welcome, ${me.name.split(" ")[0]}`} />
        <SchedulePanel days={days} legend={<ScheduleLegend />} />
      </div>
    </PortalShell>
  );
}
