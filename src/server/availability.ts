import { SLOT_MINUTES, formatTime } from "./schedule";

/**
 * Guest availability is stored as CSV in a single long-text field — one
 * `date,start,end` window per row — so it stays readable and hand-editable in
 * Airtable, and does not break when the schedule moves.
 *
 *   date,start,end
 *   2026-10-23,09:00,13:00
 */

export type Window = { date: string; start: number; end: number };

export function parseAvailability(csv: string): Window[] {
  const windows: Window[] = [];
  for (const line of csv.split(/\r?\n/)) {
    const row = line.trim();
    if (!row || row.toLowerCase().startsWith("date,")) continue;
    const [date, start, end] = row.split(",").map((part) => part.trim());
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? "")) continue;
    const from = toMinutes(start);
    const to = toMinutes(end);
    if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) continue;
    windows.push({ date, start: from, end: to });
  }
  return windows;
}

/** Every selected slot, as `date|minutes` keys — what the checkboxes bind to. */
export function slotsFromWindows(windows: Window[]): Set<string> {
  const slots = new Set<string>();
  for (const w of windows) {
    for (let m = w.start; m < w.end; m += SLOT_MINUTES) slots.add(`${w.date}|${m}`);
  }
  return slots;
}

/**
 * The inverse: contiguous selected slots are compacted back into as few
 * windows as possible, so the stored field stays short and legible.
 */
export function serializeAvailability(slots: Iterable<string>): string {
  const byDate = new Map<string, number[]>();
  for (const slot of slots) {
    const [date, raw] = slot.split("|");
    const minutes = Number(raw);
    if (!date || !Number.isFinite(minutes)) continue;
    if (!byDate.has(date)) byDate.set(date, []);
    byDate.get(date)!.push(minutes);
  }

  const rows: string[] = ["date,start,end"];
  for (const date of [...byDate.keys()].sort()) {
    const minutes = [...new Set(byDate.get(date)!)].sort((a, b) => a - b);
    let start: number | null = null;
    let previous: number | null = null;

    for (const m of minutes) {
      if (start === null) {
        start = m;
      } else if (previous !== null && m !== previous + SLOT_MINUTES) {
        rows.push(`${date},${hhmm(start)},${hhmm(previous + SLOT_MINUTES)}`);
        start = m;
      }
      previous = m;
    }
    if (start !== null && previous !== null) {
      rows.push(`${date},${hhmm(start)},${hhmm(previous + SLOT_MINUTES)}`);
    }
  }
  return rows.length > 1 ? rows.join("\n") : "";
}

/** `"09:30"` to 570. NaN for anything that isn't a time. */
function toMinutes(value: string | undefined): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value ?? "");
  if (!match) return NaN;
  return Number(match[1]) * 60 + Number(match[2]);
}

function hhmm(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

/** Plain-English summary shown under the heading. */
export function describeWindows(windows: Window[]): string {
  if (!windows.length) return "No availability submitted yet.";
  return windows
    .map((w) => {
      const day = new Date(`${w.date}T12:00:00Z`).toLocaleDateString("en-US", {
        weekday: "short",
        timeZone: "UTC",
      });
      return `${day} ${formatTime(w.start)}–${formatTime(w.end)}`;
    })
    .join(" · ");
}
