import PortalShell from "@/components/dashboard/PortalShell";
import PageHeading from "@/components/dashboard/PageHeading";
import ScheduleLegend from "@/components/dashboard/ScheduleLegend";
import AvailabilityEditor from "@/components/dashboard/AvailabilityEditor";
import SchedulePanel from "@/components/dashboard/SchedulePanel";
import { requireGuest } from "@/server/auth";
import { getAssignments, getSessions } from "@/server/data";
import { personLookup } from "@/server/people";
import { buildSchedule, minutesOf } from "@/server/schedule";
import { describeWindows, parseAvailability, slotsFromWindows } from "@/server/availability";
import { updateAvailability, updateGuestBio } from "./actions";

type View = "program" | "availability" | "bio";

export default async function GuestPortal({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; saved?: string }>;
}) {
  const me = await requireGuest("program");
  const { view: rawView, saved } = await searchParams;
  const view: View =
    rawView === "availability" || rawView === "bio" ? rawView : "program";

  const [sessions, assignments, people] = await Promise.all([
    getSessions(),
    getAssignments(),
    personLookup(),
  ]);

  const days = buildSchedule({ sessions, assignments, people, viewerKey: `guest:${me.id}` });
  const windows = parseAvailability(me.availability);

  // The availability grid covers each programme day, padded to whole hours.
  const availabilityDays = days.map((day) => {
    const forDay = sessions.filter((s) => s.day === day.date);
    return {
      date: day.date,
      weekday: day.weekday,
      dayLabel: day.dayLabel,
      startMinutes: Math.min(...forDay.map((s) => minutesOf(s.start))),
      endMinutes: Math.max(...forDay.map((s) => minutesOf(s.end))),
    };
  });

  return (
    <PortalShell role="guest" active="program">
      <div id="schedule">
        <PageHeading
          title={`Welcome, ${me.name.replace(/^(Dr|Mr|Ms|Mrs|Prof)\.?\s+/i, "").split(" ")[0]}`}
          lead={
            view === "availability"
              ? "Select the times you are free."
              : view === "bio"
                ? "Shown to participants in the guest directory."
                : `Your availability: ${describeWindows(windows)}`
          }
          actions={
            <nav aria-label="View" className="flex gap-1 rounded-card border border-rule p-1">
              {(
                [
                  ["program", "Programme"],
                  ["availability", "Your availability"],
                  ["bio", "Your bio"],
                ] as const
              ).map(([key, label]) => (
                <a
                  key={key}
                  href={`/dashboard/guest?view=${key}`}
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

        {saved ? (
          <p className="mb-6 rounded-card border border-rule bg-card p-4 text-sm text-[color:var(--color-success)]">
            Saved.
          </p>
        ) : null}

        {view === "program" ? (
          <SchedulePanel days={days} legend={<ScheduleLegend />} />
        ) : null}

        {view === "availability" ? (
          <form action={updateAvailability}>
            <AvailabilityEditor
              days={availabilityDays}
              selected={slotsFromWindows(windows)}
            />
            <button
              type="submit"
              className="mt-6 min-h-11 rounded-card bg-accent px-7 text-sm font-semibold text-on-accent transition hover:bg-accent-hover active:scale-[0.97]"
            >
              Save availability
            </button>
          </form>
        ) : null}

        {view === "bio" ? (
          <form action={updateGuestBio} className="grid max-w-2xl gap-4">
            <label htmlFor="bio" className="text-sm text-foreground">
              Your directory bio
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={10}
              maxLength={4000}
              defaultValue={me.bio}
              className="w-full rounded-card border border-rule bg-surface p-3 text-sm leading-relaxed text-foreground outline-none transition focus:border-accent focus:shadow-[0_0_0_4px_rgba(147,51,51,0.10)]"
            />
            <div>
              <button
                type="submit"
                className="min-h-11 rounded-card bg-accent px-7 text-sm font-semibold text-on-accent transition hover:bg-accent-hover active:scale-[0.97]"
              >
                Save bio
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </PortalShell>
  );
}
