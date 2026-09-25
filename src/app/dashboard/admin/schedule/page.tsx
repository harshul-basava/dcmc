import PortalShell from "@/components/dashboard/PortalShell";
import PageHeading from "@/components/dashboard/PageHeading";
import ScheduleGrid from "@/components/dashboard/ScheduleGrid";
import ScheduleLegend from "@/components/dashboard/ScheduleLegend";
import SessionEditor from "@/components/dashboard/SessionEditor";
import { resizeProgramSession } from "../actions";
import { cookies } from "next/headers";
import { requireAdmin } from "@/server/auth";
import { getAssignments, getSessions } from "@/server/data";
import type { Session } from "@/server/data/types";
import { personLookup } from "@/server/people";
import {
  CONFERENCE_DAYS,
  LAST_DAY_COOKIE,
  buildSchedule,
  formatRange,
  minutesOf,
  parseDayFilter,
  serializeDayFilter,
} from "@/server/schedule";

const BASE = "/dashboard/admin/schedule";

/** The hidden form a resize fills in and submits. */
const RESIZE_FORM = "resize-session";

function dayName(date: string, long = false) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
    weekday: long ? "long" : "short",
    timeZone: "UTC",
  });
}

function dayLabel(date: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default async function AdminSchedule({
  searchParams,
}: {
  searchParams: Promise<{
    edit?: string;
    new?: string;
    saved?: string;
    error?: string;
    deleted?: string;
    days?: string;
    day?: string;
    start?: string;
    end?: string;
  }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const lastDay = (await cookies()).get(LAST_DAY_COOKIE)?.value;

  const [sessions, assignments, people] = await Promise.all([
    getSessions(),
    getAssignments(),
    personLookup(),
  ]);

  const clock = (value?: string) => (value && /^\d{2}:\d{2}$/.test(value) ? value : undefined);
  const newDefaults = {
    day: CONFERENCE_DAYS.includes(params.day ?? "")
      ? params.day
      : CONFERENCE_DAYS.includes(lastDay ?? "")
        ? lastDay
        : undefined,
    startTime: clock(params.start),
    endTime: clock(params.end),
  };

  const editing = params.edit ? (sessions.find((s) => s.id === params.edit) ?? null) : null;
  const open = Boolean(editing) || params.new === "1";

  // No viewerKey: the admin sees the programme itself, not a personal copy.
  const days = buildSchedule({ sessions, assignments, people });

  const allByDay = new Map<string, Session[]>();
  for (const session of sessions) {
    if (!allByDay.has(session.day)) allByDay.set(session.day, []);
    allByDay.get(session.day)!.push(session);
  }

  // Which days the organizer is focused on. Held in the URL rather than in
  // client state so it survives opening an event, saving, and a reload — and
  // so it works with JavaScript off, like the rest of the dashboard.
  const allDays = [...allByDay.keys()].sort();
  const selectedDays = parseDayFilter(params.days, allDays);
  const shown = new Set(selectedDays);

  const filter = serializeDayFilter(selectedDays, allDays);
  /** Carries the current filter onto a link back to this page. */
  const withFilter = (query?: string) => {
    const parts = [query, filter === null ? undefined : `days=${filter}`].filter(Boolean);
    return parts.length ? `${BASE}?${parts.join("&")}` : BASE;
  };

  const visibleDays = days.filter((day) => shown.has(day.date));
  const byDay = new Map([...allByDay].filter(([date]) => shown.has(date)));
  const visibleCount = [...byDay.values()].reduce((sum, items) => sum + items.length, 0);

  return (
    <PortalShell role="admin" active="schedule">
      <PageHeading
        title="Schedule"
        actions={
          <a
            href={withFilter("refresh=1")}
            className="inline-flex min-h-10 items-center gap-2 rounded-card border border-rule bg-card px-4 text-xs text-foreground transition hover:border-border-strong"
          >
            <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
              <path d="M15.5 6.5A6 6 0 1 0 16 13M15.5 6.5V3m0 3.5H12" />
            </svg>
            Refresh
          </a>
        }
      />

      {params.saved ? <Banner tone="ok">Saved.</Banner> : null}
      {params.deleted ? <Banner tone="ok">Event deleted.</Banner> : null}
      {params.error ? (
        <Banner tone="bad">Give the event a name, a day, and an end time after its start.</Banner>
      ) : null}

      <section className="program-panel">
        <div className="program-panel-head">
          <div>
            <h2 className="font-display text-2xl tracking-tight text-foreground">
              Program schedule
            </h2>
            <p className="mt-1 text-sm text-muted">
              Editing an event here updates Airtable and both participant dashboards.
            </p>
          </div>

          <a
            href={withFilter("new=1")}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-card bg-[color:var(--ink)] px-5 text-sm font-semibold text-[color:var(--neutral-50)] transition hover:opacity-90"
          >
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M8 3v10M3 8h10" />
            </svg>
            Create an event
          </a>
        </div>

        <div className="p-5 sm:p-6">
          <p className="mb-4 text-sm text-muted">
            Select any block to edit it. {visibleCount} of {sessions.length}{" "}
            {sessions.length === 1 ? "event" : "events"}, {byDay.size} of {allDays.length} days.
          </p>

          {/* Legend and day toggles share one row: both are controls for
              reading the calendar below, and the row wraps on narrow screens
              rather than the toggles overflowing. */}
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
            <ScheduleLegend />

            <div className="flex flex-wrap items-center gap-3">
              {filter === null ? null : (
                <a
                  href={BASE}
                  className="text-xs text-muted underline underline-offset-4 transition hover:text-foreground"
                >
                  Show all days
                </a>
              )}
              <div className="day-focus" role="group" aria-label="Days to show">
                {allDays.map((date) => {
                  const on = shown.has(date);
                  const next = on
                    ? selectedDays.filter((day) => day !== date)
                    : allDays.filter((day) => shown.has(day) || day === date);
                  return (
                    <a
                      key={date}
                      href={next.length === allDays.length ? BASE : `${BASE}?days=${next.join(",")}`}
                      // These navigate rather than toggle in place, so the
                      // state lives in the label — `aria-pressed` belongs to
                      // buttons.
                      aria-label={`${on ? "Hide" : "Show"} ${dayName(date, true)}`}
                      data-on={on}
                    >
                      {dayName(date)}
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="mt-4">
            {visibleDays.length ? (
              <ScheduleGrid
                days={visibleDays}
                editBase={withFilter()}
                resizeFormId={RESIZE_FORM}
              />
            ) : (
              <p className="rounded-card border border-rule bg-card p-6 text-center text-sm text-muted">
                No days selected.
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="mt-10 grid gap-6">
        {[...byDay.entries()].map(([date, items], index) => (
          <section key={date} className="day-panel">
            <header className="day-panel-head">
              <span className="flex items-center gap-3">
                <span className="day-panel-index">{String(index + 1).padStart(2, "0")}</span>
                <span className="font-display text-xl tracking-tight text-foreground">
                  {dayName(date, true)}
                </span>
                <span className="text-sm text-muted">{dayLabel(date)}</span>
              </span>
              <span className="text-xs uppercase tracking-[0.08em] text-muted">
                {items.length} {items.length === 1 ? "event" : "events"}
              </span>
            </header>

            <ul className="grid gap-2 p-3">
              {items.map((session) => (
                <li key={session.id}>
                  <a
                    href={withFilter(`edit=${session.id}`)}
                    className="event-row"
                    style={{ ["--block-edge" as string]: `var(--block-${session.type}-edge)` }}
                  >
                    <span className="w-28 shrink-0">
                      <span className="block text-sm font-semibold text-foreground">
                        {formatRange(minutesOf(session.start), minutesOf(session.end)).split(" – ")[0]}
                      </span>
                      <small className="text-xs text-muted">
                        to {formatRange(minutesOf(session.start), minutesOf(session.end)).split(" – ")[1]}
                      </small>
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="event-type">{session.type}</span>
                      <strong className="mt-1.5 block font-display text-base font-medium text-foreground">
                        {session.title}
                      </strong>
                      <small className="text-xs text-muted">
                        {[session.location, session.track, session.speaker]
                          .filter(Boolean)
                          .join(" · ")}
                      </small>
                    </span>

                    <span className="flex shrink-0 items-center gap-3">
                      <span
                        className={`event-status ${
                          session.status === "confirmed" ? "is-confirmed" : "is-tentative"
                        }`}
                      >
                        {session.status === "confirmed" ? "Confirmed" : "Tentative"}
                      </span>
                      <span className="event-edit">Edit</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {/* Filled in and submitted by dragging an event's bottom edge. */}
      <form id={RESIZE_FORM} action={resizeProgramSession} hidden>
        <input type="hidden" name="id" defaultValue="" />
        <input type="hidden" name="day" defaultValue="" />
        <input type="hidden" name="startTime" defaultValue="" />
        <input type="hidden" name="endTime" defaultValue="" />
        <input type="hidden" name="days" defaultValue={filter ?? ""} />
      </form>

      {open ? (
        <SessionEditor
          session={editing}
          base={withFilter()}
          daysFilter={filter}
          defaults={newDefaults}
        />
      ) : null}
    </PortalShell>
  );
}

function Banner({ tone, children }: { tone: "ok" | "bad"; children: React.ReactNode }) {
  return (
    <p
      role={tone === "bad" ? "alert" : undefined}
      className={`mb-6 rounded-card border p-4 text-sm ${
        tone === "bad"
          ? "border-accent bg-[color:var(--red-50)] text-accent"
          : "border-rule bg-card text-[color:var(--color-success)]"
      }`}
    >
      {children}
    </p>
  );
}
