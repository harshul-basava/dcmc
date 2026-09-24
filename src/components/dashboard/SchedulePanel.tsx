"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import ScheduleGrid from "@/components/dashboard/ScheduleGrid";
import type { ScheduleDay } from "@/server/schedule";

/**
 * Wraps the calendar and adds an Expand control that lifts it to fill the
 * viewport, the way the AI risk workshop dashboard does — the grid is wide and
 * tall, and reading a whole conference at once is the common case.
 *
 * `legend` shares a row with the button rather than the button floating over
 * the grid, so nothing overlaps the calendar's edge.
 *
 * The button only appears once this has mounted. Everything else on the
 * schedule works without JavaScript, so a dead control would be worse than no
 * control at all.
 */
export default function SchedulePanel({
  days,
  legend,
}: {
  days: ScheduleDay[];
  legend?: ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  /** An ISO date, or "" for every day at once. */
  const [focus, setFocus] = useState("");

  const visible = useMemo(
    () => (focus ? days.filter((day) => day.date === focus) : days),
    [days, focus],
  );

  const panelRef = useRef<HTMLElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  /*
   * The day headers pin directly below the toolbar, so they need its height —
   * which changes when the toolbar wraps. Published as a CSS variable rather
   * than React state: this is a DOM value feeding CSS, not something the
   * component renders from.
   */
  useEffect(() => {
    const panel = panelRef.current;
    const bar = barRef.current;
    if (!panel || !bar) return;

    const sync = () => panel.style.setProperty("--bar-height", `${bar.offsetHeight}px`);
    sync();

    const observer = new ResizeObserver(sync);
    observer.observe(bar);
    return () => observer.disconnect();
  }, []);

  // False while server-rendering and through hydration, true thereafter — the
  // standard way to ask whether the client is actually running yet.
  const live = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  // The panel scrolls itself while expanded, so the page behind must not.
  useEffect(() => {
    if (!expanded) return;
    document.body.classList.add("schedule-expanded");
    return () => document.body.classList.remove("schedule-expanded");
  }, [expanded]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      // Whatever is on top goes first: an open session dialog, then the panel.
      // The dialogs are driven by `:target`, so clearing the hash closes them.
      if (window.location.hash.startsWith("#session-")) {
        event.preventDefault();
        window.location.hash = "#schedule";
        return;
      }
      if (expanded) {
        event.preventDefault();
        setExpanded(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [expanded]);

  return (
    <section ref={panelRef} className={`schedule-panel${expanded ? " is-expanded" : ""}`}>
      <div ref={barRef} className="schedule-panel-bar">
        {legend ?? <span />}

        <div className="schedule-panel-controls">
          {live && days.length > 1 ? (
            <div className="day-focus" role="group" aria-label="Show one day">
              <button
                type="button"
                onClick={() => setFocus("")}
                aria-pressed={focus === ""}
              >
                All days
              </button>
              {days.map((day) => (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => setFocus(day.date)}
                  aria-pressed={focus === day.date}
                >
                  {day.weekday}
                </button>
              ))}
            </div>
          ) : null}

          {live ? (
            <button
              type="button"
              onClick={() => setExpanded((open) => !open)}
              aria-expanded={expanded}
              aria-label={expanded ? "Exit expanded schedule" : "Expand schedule"}
              className="schedule-expand"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              >
                {expanded ? (
                  <path d="M3 7h4V3M17 7h-4V3M3 13h4v4M17 13h-4v4" />
                ) : (
                  <path d="M7 3H3v4M13 3h4v4M7 17H3v-4M13 17h4v-4" />
                )}
              </svg>
              {expanded ? "Close" : "Expand"}
            </button>
          ) : null}
        </div>
      </div>

      <div className="schedule-panel-body">
        <ScheduleGrid days={visible} />
      </div>
    </section>
  );
}
