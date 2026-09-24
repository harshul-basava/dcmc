import type { Assignment, PersonKey, Session, SessionType } from "./data/types";

/** Grid resolution. One row is this many minutes tall. */
export const SLOT_MINUTES = 15;

export type ScheduleDetail = {
  location: string;
  speaker: string;
  description: string;
  slidoUrl?: string;
  /** "Your group", "Your partner" — the personalized line, when there is one. */
  assignmentLabel?: string;
  assignmentValue?: string;
};

export type ScheduleBlock = {
  /** Stable within a render; used for the `:target` dialog anchor. */
  key: string;
  sessionId: string;
  title: string;
  type: SessionType;
  startMinutes: number;
  endMinutes: number;
  /** True when this block is personal to the viewer, not just shared programme. */
  mine: boolean;
  timeLabel: string;
  speaker: string;
  detail: ScheduleDetail;
  /** Filled in by the layout pass. */
  lane: number;
  lanes: number;
};

export type ScheduleDay = {
  date: string;
  weekday: string;
  dayLabel: string;
  startMinutes: number;
  endMinutes: number;
  blocks: ScheduleBlock[];
};

/** Minutes since midnight from a `YYYY-MM-DDTHH:MM` local string. */
export function minutesOf(iso: string): number {
  const [, time = "00:00"] = iso.split("T");
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function formatTime(minutes: number): string {
  const h24 = Math.floor(minutes / 60);
  const m = minutes % 60;
  const suffix = h24 >= 12 ? "pm" : "am";
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  return m === 0 ? `${h}${suffix}` : `${h}:${String(m).padStart(2, "0")}${suffix}`;
}

export function formatRange(start: number, end: number): string {
  return `${formatTime(start)} – ${formatTime(end)}`;
}

function weekdayOf(date: string): string {
  // Parsed as UTC noon so a timezone west of UTC can't roll it back a day.
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: "UTC",
  });
}

function dayLabelOf(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

const PERSONALIZED = new Set<SessionType>(["one-to-one", "small-group"]);

/** The name to show for whoever else is in a group, by person key. */
export type PersonLookup = Map<string, { name: string; isGuest: boolean }>;

/**
 * Builds one person's schedule: the shared programme, with personalized blocks
 * resolved against their own published assignments.
 *
 * `viewerKey` omitted renders the programme impersonally — every 1:1 and small
 * group shows as a plain block. That is what an unassigned viewer, or a
 * preview, should see.
 */
export function buildSchedule({
  sessions,
  assignments,
  people,
  viewerKey,
}: {
  sessions: Session[];
  assignments: Assignment[];
  people: PersonLookup;
  viewerKey?: PersonKey;
}): ScheduleDay[] {
  const published = assignments.filter((a) => a.state === "published");
  const mine = viewerKey ? published.filter((a) => a.personKey === viewerKey) : [];

  const blocks: (ScheduleBlock & { date: string })[] = [];

  for (const session of sessions) {
    const start = minutesOf(session.start);
    const end = minutesOf(session.end);
    const base = {
      sessionId: session.id,
      type: session.type,
      speaker: session.speaker,
      date: session.day,
    };

    const detail: ScheduleDetail = {
      location: session.location,
      speaker: session.speaker,
      description: session.description,
      slidoUrl: session.slidoUrl,
    };

    if (!PERSONALIZED.has(session.type) || !session.personalized) {
      blocks.push({
        ...base,
        key: `${session.id}`,
        title: session.title,
        startMinutes: start,
        endMinutes: end,
        mine: false,
        timeLabel: formatRange(start, end),
        detail,
        lane: 0,
        lanes: 1,
      });
      continue;
    }

    const own = mine.filter((a) => a.sessionId === session.id);

    if (session.type === "one-to-one") {
      // A 1:1 block is really two conversations back to back, so it renders as
      // two half-blocks — each can have a different partner, or none yet.
      const mid = start + Math.round((end - start) / 2 / SLOT_MINUTES) * SLOT_MINUTES;
      const halves: [string, number, number][] = [
        ["S1", start, mid],
        ["S2", mid, end],
      ];

      for (const [half, from, to] of halves) {
        const assignment = own.find((a) => a.group.startsWith(half));
        const partner = assignment
          ? published
              .filter((a) => a.sessionId === session.id && a.group === assignment.group && a.personKey !== viewerKey)
              .map((a) => people.get(a.personKey)?.name)
              .filter(Boolean)
              .join(" and ")
          : "";

        blocks.push({
          ...base,
          key: `${session.id}-${half}`,
          title: partner ? `1:1 with ${partner}` : `${session.title} · ${half === "S1" ? "First half" : "Second half"}`,
          startMinutes: from,
          endMinutes: to,
          mine: Boolean(partner),
          timeLabel: formatRange(from, to),
          detail: {
            ...detail,
            location: assignment?.location || session.location,
            assignmentLabel: half === "S1" ? "First conversation" : "Second conversation",
            // No assignment yet is a real state, and saying so beats a blank.
            assignmentValue: partner || "To be announced",
          },
          lane: 0,
          lanes: 1,
        });
      }
      continue;
    }

    // Small group: one block, labelled by the guest facilitating it when there
    // is one, since "Group C" means nothing to an attendee.
    const assignment = own[0];
    const members = assignment
      ? published.filter((a) => a.sessionId === session.id && a.group === assignment.group)
      : [];
    const facilitator = members
      .map((a) => people.get(a.personKey))
      .find((p) => p?.isGuest)?.name;

    blocks.push({
      ...base,
      key: `${session.id}`,
      title: assignment ? `Small group · ${facilitator ?? assignment.group}` : session.title,
      startMinutes: start,
      endMinutes: end,
      mine: Boolean(assignment),
      timeLabel: formatRange(start, end),
      detail: {
        ...detail,
        location: assignment?.location || session.location,
        assignmentLabel: "Your group",
        assignmentValue: assignment
          ? [assignment.group, facilitator ? `with ${facilitator}` : null].filter(Boolean).join(" ")
          : "To be announced",
      },
      lane: 0,
      lanes: 1,
    });
  }

  // Group into days, then lay each day out.
  const byDate = new Map<string, ScheduleBlock[]>();
  for (const { date, ...block } of blocks) {
    if (!byDate.has(date)) byDate.set(date, []);
    byDate.get(date)!.push(block);
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, dayBlocks]) => {
      dayBlocks.sort((a, b) => a.startMinutes - b.startMinutes || a.endMinutes - b.endMinutes);
      assignLanes(dayBlocks);

      const earliest = Math.min(...dayBlocks.map((b) => b.startMinutes));
      const latest = Math.max(...dayBlocks.map((b) => b.endMinutes));
      return {
        date,
        weekday: weekdayOf(date),
        dayLabel: dayLabelOf(date),
        // Whole hours, then half an hour of headroom: an hour label is centred
        // on its line, so one sitting exactly at the top would straddle the
        // header's rule. The gap also gives the first block room to breathe.
        startMinutes: Math.floor(earliest / 60) * 60 - 30,
        endMinutes: Math.ceil(latest / 60) * 60 + 15,
        blocks: dayBlocks,
      };
    });
}

/**
 * Side-by-side placement for blocks that genuinely overlap in time. Blocks are
 * grouped into clusters of mutual overlap; within a cluster each takes the
 * first lane free at its start time, and every block in the cluster is widened
 * to the same fraction so the columns line up.
 */
function assignLanes(blocks: ScheduleBlock[]): void {
  let cluster: ScheduleBlock[] = [];
  let clusterEnd = -1;

  const flush = () => {
    if (!cluster.length) return;
    const lanes = Math.max(...cluster.map((b) => b.lane)) + 1;
    for (const block of cluster) block.lanes = lanes;
    cluster = [];
  };

  for (const block of blocks) {
    if (block.startMinutes >= clusterEnd) flush();

    const taken = new Set(
      cluster.filter((b) => b.endMinutes > block.startMinutes).map((b) => b.lane),
    );
    let lane = 0;
    while (taken.has(lane)) lane += 1;
    block.lane = lane;

    cluster.push(block);
    clusterEnd = Math.max(clusterEnd, block.endMinutes);
  }
  flush();
}

/** Whole-hour marks for the time rail, from the first whole hour in range. */
export function hourMarks(startMinutes: number, endMinutes: number): number[] {
  const marks: number[] = [];
  for (let m = Math.ceil(startMinutes / 60) * 60; m <= endMinutes; m += 60) marks.push(m);
  return marks;
}

/** Rail label: `8:00 AM`. Longer than the block format, and easier to scan. */
export function formatHour(minutes: number): string {
  const h24 = Math.floor(minutes / 60);
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h}:${String(minutes % 60).padStart(2, "0")} ${h24 >= 12 ? "PM" : "AM"}`;
}
