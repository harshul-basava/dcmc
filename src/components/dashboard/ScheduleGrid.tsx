"use client";

import {
  SLOT_MINUTES,
  formatHour,
  hourMarks,
  type ScheduleDay,
} from "@/server/schedule";

const ROW_HEIGHT = 28; // px per 15-minute slot; mirrors --slot-height.

function px(minutes: number): number {
  return (minutes / SLOT_MINUTES) * ROW_HEIGHT;
}

/**
 * The calendar. Every day shares one time window so the rail lines up across
 * columns, and blocks are absolutely positioned from their start and duration.
 *
 * Day headers stay pinned while the grid scrolls under them, so you never lose
 * track of which column you are reading.
 *
 * Each block is an anchor to a `:target` dialog rendered below the grid — no
 * client JavaScript is involved in opening or closing one.
 */
/**
 * `editBase` may already carry a query — the admin schedule puts its day
 * filter there — so the separator has to be chosen, not assumed. Appending a
 * second "?" folded `edit=` into the last day of the filter, which silently
 * dropped that day from the view.
 */
function editLink(editBase: string, sessionId: string): string {
  return `${editBase}${editBase.includes("?") ? "&" : "?"}edit=${sessionId}`;
}

export default function ScheduleGrid({
  days,
  editBase,
}: {
  days: ScheduleDay[];
  /**
   * Admin mode: blocks link to the editor for that event instead of opening a
   * participant dialog. A string rather than a callback, because this is a
   * client component and functions cannot cross the server boundary.
   */
  editBase?: string;
}) {
  if (!days.length) {
    return (
      <div className="rounded-card border border-dashed border-rule px-6 py-14 text-center">
        <p className="text-sm text-muted">The programme has not been published yet.</p>
      </div>
    );
  }

  const start = Math.min(...days.map((d) => d.startMinutes));
  const end = Math.max(...days.map((d) => d.endMinutes));
  const height = px(end - start);
  // Distance from the top of the grid to the first whole hour, so the hour
  // lines and the rail labels agree.
  const hourOffset = px(Math.ceil(start / 60) * 60 - start);

  return (
    <>
      <div className="calendar-scroll rounded-card border border-rule bg-card">
        <div
          className="calendar-grid"
          style={{ ["--day-count" as string]: String(days.length) }}
        >
          <div className="rail-column">
            {/* Spacer matching the day headers, so the rail starts level. */}
            <div className="calendar-head" />
            <div className="time-rail" style={{ height }}>
              {hourMarks(start, end).map((m) => (
                <span key={m} style={{ top: px(m - start) }}>
                  {formatHour(m)}
                </span>
              ))}
            </div>
          </div>

          {days.map((day) => (
            <section key={day.date} className="day-column" data-date={day.date}>
              <header className="calendar-head">
                <span className="calendar-head-inner">
                  <strong className="font-display text-base font-medium text-foreground">
                    {day.weekday}
                  </strong>
                  <span className="text-xs text-muted">{day.dayLabel}</span>
                </span>
              </header>

              <div
                className="day-slots"
                style={{ height, ["--hour-offset" as string]: `${hourOffset}px` }}
              >
                {day.blocks.map((block) => {
                  const width = 100 / block.lanes;
                  const duration = block.endMinutes - block.startMinutes;
                  return (
                    <a
                      key={block.key}
                      href={
                        editBase
                          ? editLink(editBase, block.sessionId)
                          : `#session-${block.key}`
                      }
                      className={`program-block program-block-${block.type}${
                        duration < 45 ? " program-block-short" : ""
                      }${block.mine ? " program-block-mine" : ""}`}
                      style={{
                        top: px(block.startMinutes - start),
                        height: Math.max(px(duration) - 2, 18),
                        left: `calc(${block.lane * width}% + 2px)`,
                        width: `calc(${width}% - 4px)`,
                        ["--block-fill" as string]: `var(--block-${block.type})`,
                        ["--block-edge" as string]: `var(--block-${block.type}-edge)`,
                      }}
                    >
                      <strong>{block.title}</strong>
                      <span className="program-block-meta">{block.timeLabel}</span>
                      {block.speaker ? (
                        <em className="program-block-speaker">{block.speaker}</em>
                      ) : null}
                    </a>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>

      {/* The participant dialogs; in admin mode the block is a link to the
          editor, so there is nothing to open in place. */}
      {editBase ? null : days.flatMap((day) =>
        day.blocks.map((block) => (
          <section
            key={block.key}
            id={`session-${block.key}`}
            className="overlay"
            role="dialog"
            aria-modal="true"
            aria-label={block.title}
          >
            <a className="overlay-backdrop" href="#schedule" aria-label="Close" tabIndex={-1} />
            <div className="overlay-dialog">
              <a className="overlay-close" href="#schedule" aria-label="Close">
                ✕
              </a>

              <p className="text-xs uppercase tracking-[0.1em] text-muted">
                {day.weekday} · {block.timeLabel}
              </p>
              <h2 className="mt-1 font-display text-2xl leading-tight tracking-tight text-foreground">
                {block.title}
              </h2>

              <dl className="mt-5 grid gap-3 text-sm">
                {block.detail.assignmentLabel ? (
                  <div className="grid grid-cols-[8rem_1fr] gap-3">
                    <dt className="text-muted">{block.detail.assignmentLabel}</dt>
                    <dd className="text-foreground">{block.detail.assignmentValue}</dd>
                  </div>
                ) : null}
                {block.detail.location ? (
                  <div className="grid grid-cols-[8rem_1fr] gap-3">
                    <dt className="text-muted">Location</dt>
                    <dd className="text-foreground">{block.detail.location}</dd>
                  </div>
                ) : null}
                {block.detail.speaker ? (
                  <div className="grid grid-cols-[8rem_1fr] gap-3">
                    <dt className="text-muted">Speaker</dt>
                    <dd className="text-foreground">{block.detail.speaker}</dd>
                  </div>
                ) : null}
              </dl>

              {block.detail.description ? (
                <p className="mt-5 text-sm leading-relaxed text-muted">{block.detail.description}</p>
              ) : null}

              {block.detail.slidoUrl ? (
                <a
                  href={block.detail.slidoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 inline-flex min-h-11 items-center rounded-card bg-accent px-5 text-sm font-semibold text-on-accent transition hover:bg-accent-hover"
                >
                  Join the Q&amp;A
                </a>
              ) : null}
            </div>
          </section>
        )),
      )}
    </>
  );
}
