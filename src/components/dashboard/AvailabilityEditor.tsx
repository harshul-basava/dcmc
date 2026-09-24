import { SLOT_MINUTES, formatTime, hourMarks } from "@/server/schedule";

const ROW_HEIGHT = 28;

export type AvailabilityDay = {
  date: string;
  weekday: string;
  dayLabel: string;
  startMinutes: number;
  endMinutes: number;
};

/**
 * Paint-to-select availability, built from native checkboxes: one per
 * 15-minute slot. Clicking or dragging over them works in the browser without
 * any JavaScript of ours, and the form submits the checked set directly.
 */
export default function AvailabilityEditor({
  days,
  selected,
}: {
  days: AvailabilityDay[];
  selected: Set<string>;
}) {
  const start = Math.min(...days.map((d) => d.startMinutes));
  const end = Math.max(...days.map((d) => d.endMinutes));

  return (
    <div className="calendar-scroll rounded-card border border-rule bg-card">
      <div className="calendar-grid" style={{ ["--day-count" as string]: String(days.length) }}>
        <div>
          <div className="h-14 border-b border-rule" />
          <div
            className="time-rail"
            style={{ height: ((end - start) / SLOT_MINUTES) * ROW_HEIGHT }}
          >
            {hourMarks(start, end).map((m) => (
              <span key={m} style={{ top: ((m - start) / SLOT_MINUTES) * ROW_HEIGHT }}>
                {formatTime(m)}
              </span>
            ))}
          </div>
        </div>

        {days.map((day) => (
          <section key={day.date} className="day-column">
            <header className="flex h-14 flex-col justify-center border-b border-rule px-3">
              <strong className="font-display text-sm font-medium text-foreground">
                {day.weekday}
              </strong>
              <span className="text-xs text-muted">{day.dayLabel}</span>
            </header>

            <div>
              {Array.from(
                { length: (end - start) / SLOT_MINUTES },
                (_, i) => start + i * SLOT_MINUTES,
              ).map((minutes) => {
                const inRange = minutes >= day.startMinutes && minutes < day.endMinutes;
                const slot = `${day.date}|${minutes}`;
                if (!inRange) {
                  return (
                    <span
                      key={slot}
                      aria-hidden="true"
                      className="block border-b border-rule bg-[color:var(--neutral-100)]"
                      style={{ height: ROW_HEIGHT }}
                    />
                  );
                }
                return (
                  <label key={slot} className="slot-control block cursor-pointer">
                    <input
                      type="checkbox"
                      name={`slot-${slot}`}
                      defaultChecked={selected.has(slot)}
                    />
                    <span />
                    <span className="sr-only">
                      {day.weekday} {formatTime(minutes)} available
                    </span>
                  </label>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
