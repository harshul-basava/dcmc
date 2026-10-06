import type { Metadata } from "next";
import { connection } from "next/server";
import SchedulePanel from "@/components/dashboard/SchedulePanel";
import ScheduleLegend from "@/components/dashboard/ScheduleLegend";
import { getSessions } from "@/server/data";
import { buildSchedule } from "@/server/schedule";
import AutoRefresh from "./AutoRefresh";
import "../dashboard/dashboard.css";
import "./schedule.css";

export const metadata: Metadata = {
  title: "Schedule — DC Mini-Conference",
  description: "Browse the latest DC Mini-Conference schedule. All times are Eastern Time.",
  alternates: { canonical: "/schedule" },
  robots: { index: false, follow: false },
};

export default async function PublicSchedule() {
  await connection();
  // Only programme data crosses the public boundary. No roster or pairings
  // are needed to render the shared schedule.
  const sessions = await getSessions();
  const days = buildSchedule({ sessions, assignments: [], people: new Map() });
  // The public overview has no detail UI; omit those fields from its payload too.
  for (const day of days) {
    for (const block of day.blocks) {
      block.detail = { location: "", speaker: "", description: "" };
    }
  }

  return (
    <main id="top" className="portal public-schedule mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-8 sm:py-12">
      <header className="mb-7">
        <h1 className="font-display text-4xl tracking-tight sm:text-5xl">DC Mini-Conference Schedule</h1>
        <p className="mt-3 text-sm font-semibold">All times are Eastern Time (Washington, DC).</p>
        <p className="mt-1 text-xs text-muted">Schedule subject to change</p>
        <noscript><p className="mt-2 text-xs text-muted">Reload this page to see schedule updates.</p></noscript>
      </header>
      <AutoRefresh />
      <SchedulePanel days={days} legend={<ScheduleLegend />} showDetails={false} />
    </main>
  );
}
