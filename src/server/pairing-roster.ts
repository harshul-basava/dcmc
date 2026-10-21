import type { Assignment, Guest, Participant, PersonKey, Session } from "./data/types";
import { excludedFrom } from "./pairings";
import { parseAvailability } from "./availability";
import { minutesOf, SLOT_MINUTES } from "./schedule";

/** The same availability boundary for the visual editor and manual saves. */
export function pairingRoster(session: Session, participants: Participant[], guests: Guest[], assignments: Assignment[]) {
  const excluded = excludedFrom(assignments, session.id);
  const start = minutesOf(session.start);
  const end = minutesOf(session.end);
  const mid = start + Math.round((end - start) / 2 / SLOT_MINUTES) * SLOT_MINUTES;
  const eligible = (from: number, to: number): PersonKey[] => [
    ...participants.map((p) => `participant:${p.id}` as PersonKey),
    ...guests.filter((g) => parseAvailability(g.availability).some((w) => w.date === session.day && w.start <= from && w.end >= to)).map((g) => `guest:${g.id}` as PersonKey),
  ].filter((key) => !excluded.has(key));
  return { halves: [eligible(start, mid), eligible(mid, end)] as [PersonKey[], PersonKey[]], times: [[start, mid], [mid, end]] };
}
