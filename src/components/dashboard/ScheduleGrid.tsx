"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  SLOT_MINUTES,
  formatHour,
  formatRange,
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

/** `690` -> `"11:30"`. */
function clockTime(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

/** A new event created by clicking empty space runs an hour by default. */
const NEW_EVENT_MINUTES = 60;

type Resize = {
  sessionId: string;
  date: string;
  startMinutes: number;
  /** Where the bottom edge was when the drag began. */
  fromEnd: number;
  originY: number;
  /** Snapped, and never shorter than one slot. */
  endMinutes: number;
};

export default function ScheduleGrid({
  days,
  editBase,
  resizeFormId,
}: {
  days: ScheduleDay[];
  /**
   * Admin mode: blocks link to the editor for that event instead of opening a
   * participant dialog. A string rather than a callback, because this is a
   * client component and functions cannot cross the server boundary.
   */
  editBase?: string;
  /**
   * Admin only: the id of a form that posts a new end time. Dragging an
   * event's bottom edge fills it in and submits it, so the server recomputes
   * overlaps and lane widths rather than the calendar laying itself out
   * twice.
   *
   * A form id rather than an action prop because this component is shared
   * with the participant views, which have no business importing an admin
   * action.
   */
  resizeFormId?: string;
}) {
  const resizable = Boolean(editBase && resizeFormId);
  const [resize, setResize] = useState<Resize | null>(null);
  /** Read by the window listeners without re-subscribing on every move. */
  const resizeRef = useRef<Resize | null>(null);
  const suppressClick = useRef(false);

  const commitResize = useCallback(() => {
    const current = resizeRef.current;
    resizeRef.current = null;
    setResize(null);
    if (!current) return;

    // The browser fires a click after the drag; it must not open the editor.
    suppressClick.current = true;
    if (current.endMinutes === current.fromEnd) return;

    const form = document.getElementById(resizeFormId!) as HTMLFormElement | null;
    if (!form) return;
    const set = (name: string, value: string) => {
      const field = form.elements.namedItem(name);
      if (field instanceof HTMLInputElement) field.value = value;
    };
    set("id", current.sessionId);
    set("day", current.date);
    set("startTime", clockTime(current.startMinutes));
    set("endTime", clockTime(current.endMinutes));
    form.requestSubmit();
  }, [resizeFormId]);

  /*
   * Move and release are tracked on the window rather than the handle.
   * Pointer capture can be lost — another element taking it, the browser
   * cancelling the gesture — and a drag that loses its end event would leave
   * the block stuck following the cursor.
   */
  const isResizing = resize !== null;

  useEffect(() => {
    if (!isResizing) return;

    const onMove = (event: PointerEvent) => {
      const current = resizeRef.current;
      if (!current) return;
      const steps = Math.round((event.clientY - current.originY) / ROW_HEIGHT);
      const next = Math.max(
        current.startMinutes + SLOT_MINUTES,
        current.fromEnd + steps * SLOT_MINUTES,
      );
      if (next === current.endMinutes) return;
      const updated = { ...current, endMinutes: next };
      resizeRef.current = updated;
      setResize(updated);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", commitResize);
    window.addEventListener("pointercancel", commitResize);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", commitResize);
      window.removeEventListener("pointercancel", commitResize);
    };
    // Only the presence of a drag matters; the values live in the ref, so
    // the listeners are not re-subscribed on every pointermove.
  }, [isResizing, commitResize]);

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
                className={`day-slots${resizable ? " is-editable" : ""}`}
                style={{ height, ["--hour-offset" as string]: `${hourOffset}px` }}
                onClick={
                  resizable
                    ? (event) => {
                        // Only empty space: a click on a block is that
                        // block's own link.
                        if (event.target !== event.currentTarget) return;
                        const box = event.currentTarget.getBoundingClientRect();
                        const slot =
                          start +
                          Math.floor((event.clientY - box.top) / ROW_HEIGHT) * SLOT_MINUTES;
                        const params = new URLSearchParams({
                          new: "1",
                          day: day.date,
                          start: clockTime(slot),
                          end: clockTime(Math.min(slot + NEW_EVENT_MINUTES, 24 * 60 - SLOT_MINUTES)),
                        });
                        window.location.href = `${editBase}${
                          editBase!.includes("?") ? "&" : "?"
                        }${params}`;
                      }
                    : undefined
                }
              >
                {/* The day columns share one window, so a day that starts
                    late opens with a run of time that is not merely empty —
                    it is outside the programme. Hatching says so. */}
                {day.blocks.length &&
                Math.min(...day.blocks.map((b) => b.startMinutes)) > start ? (
                  <div
                    className="day-offhours"
                    aria-hidden="true"
                    style={{
                      height: px(Math.min(...day.blocks.map((b) => b.startMinutes)) - start),
                    }}
                  />
                ) : null}

                {day.blocks.map((block) => {
                  const width = 100 / block.lanes;
                  const dragging = resize?.sessionId === block.sessionId;
                  const endMinutes = dragging ? resize.endMinutes : block.endMinutes;
                  const duration = endMinutes - block.startMinutes;
                  return (
                    <a
                      key={block.key}
                      href={
                        editBase
                          ? editLink(editBase, block.sessionId)
                          : `#session-${block.key}`
                      }
                      draggable={resizable ? false : undefined}
                      onClick={
                        resizable
                          ? (event) => {
                              if (suppressClick.current) {
                                event.preventDefault();
                                suppressClick.current = false;
                              }
                            }
                          : undefined
                      }
                      className={`program-block program-block-${block.type}${
                        duration < 45 ? " program-block-short" : ""
                      }${block.mine ? " program-block-mine" : ""}${
                        dragging ? " is-resizing" : ""
                      }${block.overlay ? " program-block-overlay" : ""}`}
                      style={{
                        top: px(block.startMinutes - start),
                        height: Math.max(px(duration) - 2, 18),
                        // An overlay is inset from its container's left edge
                        // so the block underneath stays legible.
                        left: block.overlay
                          ? `calc(${block.lane * width}% + 2px + var(--overlay-inset))`
                          : `calc(${block.lane * width}% + 2px)`,
                        width: block.overlay
                          ? `calc(${width}% - 4px - var(--overlay-inset))`
                          : `calc(${width}% - 4px)`,
                        ["--block-fill" as string]: `var(--block-${block.type})`,
                        ["--block-edge" as string]: `var(--block-${block.type}-edge)`,
                      }}
                    >
                      <strong>{block.title}</strong>
                      <span className="program-block-meta">
                        {dragging
                          ? formatRange(block.startMinutes, endMinutes)
                          : block.timeLabel}
                      </span>
                      {block.speaker ? (
                        <em className="program-block-speaker">{block.speaker}</em>
                      ) : null}

                      {resizable ? (
                        <span
                          className="program-block-grip"
                          aria-hidden="true"
                          onPointerDown={(event) => {
                            if (event.button !== 0) return;
                            // Otherwise the press starts a text selection that
                            // fights the drag.
                            event.preventDefault();
                            const next = {
                              sessionId: block.sessionId,
                              date: day.date,
                              startMinutes: block.startMinutes,
                              fromEnd: block.endMinutes,
                              originY: event.clientY,
                              endMinutes: block.endMinutes,
                            };
                            resizeRef.current = next;
                            setResize(next);
                          }}
                        />
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
