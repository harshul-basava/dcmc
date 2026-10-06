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

  return (
    <main id="top" className="portal public-schedule mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-8 sm:py-12">
      <header className="mb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">DC Mini-Conference · Washington, DC</p>
        <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">Conference schedule</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          Explore the programme and let your organiser know which times you would like to join.
          Select an event for details.
        </p>
        <p className="mt-3 text-sm font-semibold">All times are Eastern Time (Washington, DC).</p>
        <p className="mt-1 text-xs text-muted">Schedule subject to change · View only · Updates automatically every minute</p>
        <noscript><p className="mt-2 text-xs text-muted">Reload this page to see schedule updates.</p></noscript>
      </header>
      <AutoRefresh />
      <SchedulePanel days={days} legend={<ScheduleLegend />} />
    </main>
  );
}
