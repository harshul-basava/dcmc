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
import ProfileStatus from "@/components/dashboard/ProfileStatus";
import DirectoryPreview from "@/components/dashboard/DirectoryPreview";
import GuestProfileForm from "@/components/dashboard/GuestProfileForm";
import { GUEST_PROFILE_ERRORS, type GuestProfileError } from "@/server/guest-profile";
import { updateAvailability, updateGuestProfile } from "./actions";

type View = "program" | "availability" | "profile";

export default async function GuestPortal({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; saved?: string; error?: string }>;
}) {
  const me = await requireGuest("program");
  const { view: rawView, saved, error } = await searchParams;
  const view: View =
    rawView === "availability" || rawView === "profile" ? rawView : "program";

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
              : view === "profile"
                ? "This is what participants see about you in the guest directory."
                : `Your availability: ${describeWindows(windows)}`
          }
          actions={
            <nav aria-label="View" className="flex gap-1 rounded-card border border-rule p-1">
              {(
                [
                  ["program", "Programme"],
                  ["availability", "Your availability"],
                  ["profile", "Your profile"],
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

        {view === "profile" ? (
          <>
            <ProfileStatus person={me} directory="guest directory" />

            {error ? (
              <p
                role="alert"
                className="mb-6 rounded-card border border-accent bg-[color:var(--red-50)] p-4 text-sm text-accent"
              >
                {GUEST_PROFILE_ERRORS[error as GuestProfileError] ??
                  "Something went wrong. Please try again."}
              </p>
            ) : null}

            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
              <GuestProfileForm guest={me} action={updateGuestProfile} />
              <DirectoryPreview person={me} />
            </div>
          </>
        ) : null}
      </div>
    </PortalShell>
  );
}
