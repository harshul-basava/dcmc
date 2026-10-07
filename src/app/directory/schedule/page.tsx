import type { Metadata } from "next";
import { hasDirectoryAccess } from "@/server/directory-access";
import { getSessions } from "@/server/data";
import { buildSchedule } from "@/server/schedule";
import SchedulePanel from "@/components/dashboard/SchedulePanel";
import ScheduleLegend from "@/components/dashboard/ScheduleLegend";
import AutoRefresh from "../../schedule/AutoRefresh";
import DirectoryPortal from "../DirectoryPortal";

export const metadata: Metadata = {
  title: "Schedule — DC Mini-Conference",
  robots: { index: false, follow: false },
};

export default async function ProtectedSchedule({ searchParams }: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const unlocked = await hasDirectoryAccess();
  // Check access before fetching or rendering any schedule data, including
  // when someone opens this nested route directly.
  if (!unlocked) return <DirectoryPortal active="schedule" unlocked={false} error={error} />;

  const days = buildSchedule({ sessions: await getSessions(), assignments: [], people: new Map() });
  for (const day of days) {
    for (const block of day.blocks) block.detail = { location: "", speaker: "", description: "" };
  }
  return (
    <DirectoryPortal active="schedule" unlocked>
      <AutoRefresh />
      <SchedulePanel days={days} legend={<ScheduleLegend />} showDetails={false} />
    </DirectoryPortal>
  );
}
