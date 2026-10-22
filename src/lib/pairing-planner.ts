import type { Assignment, PersonKey } from "@/server/data/types";

export type PairingPerson = {
  key: PersonKey;
  name: string;
  organization: string;
  photo?: string;
  initials: string;
};
export type PairingGroup = { id: string; members: PersonKey[]; location: string };
export type PairingRound = { eligible: PersonKey[]; groups: PairingGroup[] };
export type PairingPlan = [PairingRound, PairingRound];

export const pairingKey = (a: string, b: string) => [a, b].sort().join("|");
export function groupPairKeys(members: string[]): string[] {
  return members.flatMap((a, i) => members.slice(i + 1).map((b) => pairingKey(a, b)));
}

export type PairingHistory = { key: string; label: string };
export type PairingRepeat = { key: string; half: number; groupId: string; members: [PersonKey, PersonKey]; slots: string[] };

/** Compare the editable plan with both halves and the other saved blocks. */
export function findPairingRepeats(plan: PairingPlan, history: PairingHistory[], times: string[]): PairingRepeat[] {
  const elsewhere = new Map<string, Set<string>>();
  for (const { key, label } of history) {
    if (!elsewhere.has(key)) elsewhere.set(key, new Set());
    elsewhere.get(key)!.add(label);
  }
  const roundKeys = plan.map((round) => new Set(round.groups.flatMap((group) => groupPairKeys(group.members))));
  return plan.flatMap((round, half) => round.groups.flatMap((group) =>
    group.members.flatMap((a, i) => group.members.slice(i + 1).flatMap((b) => {
      const key = pairingKey(a, b);
      const slots = new Set(elsewhere.get(key));
      if (roundKeys[1 - half].has(key)) slots.add(`${times[1 - half]} (other half of this block)`);
      return slots.size ? [{ key, half, groupId: group.id, members: [a, b] as [PersonKey, PersonKey], slots: [...slots] }] : [];
    })),
  ));
}

export type GuestTimeWarning = {
  participantKey: PersonKey;
  half: number;
  groupId: string;
  guestCount: number;
  otherMeetings: { guestKey: PersonKey; label: string }[];
};

/** Equity concerns are advisory: compare distinct guests across the editable
 * halves and other blocks' working drafts (or their released pairings). */
export function findGuestTimeWarnings(plan: PairingPlan, history: PairingHistory[], times: string[]): GuestTimeWarning[] {
  type Meeting = { participantKey: PersonKey; guestKey: PersonKey; label: string; half?: number; groupId?: string };
  const meetings: Meeting[] = [];
  const guestEdge = (members: string[]) => {
    if (members.length !== 2) return null;
    const participantKey = members.find((key) => key.startsWith("participant:")) as PersonKey | undefined;
    const guestKey = members.find((key) => key.startsWith("guest:")) as PersonKey | undefined;
    return participantKey && guestKey ? { participantKey, guestKey } : null;
  };
  for (const { key, label } of history) {
    const edge = guestEdge(key.split("|"));
    if (edge) meetings.push({ ...edge, label });
  }
  for (const [half, round] of plan.entries()) {
    for (const group of round.groups) {
      for (const key of groupPairKeys(group.members)) {
        const edge = guestEdge(key.split("|"));
        if (edge) meetings.push({ ...edge, label: `${times[half]} (${half === 0 ? "first" : "second"} half of this block)`, half, groupId: group.id });
      }
    }
  }
  return plan.flatMap((round, half) => round.groups.flatMap((group) => {
    const currentGuests = group.members.filter((key) => key.startsWith("guest:"));
    if (!currentGuests.length) return [];
    return [...new Set(group.members.filter((key) => key.startsWith("participant:")))].flatMap((participantKey) => {
      const own = meetings.filter((m) => m.participantKey === participantKey);
      const guestCount = new Set(own.map((m) => m.guestKey)).size;
      if (guestCount < 2) return [];
      const otherMeetings = new Map<string, { guestKey: PersonKey; label: string }>();
      for (const meeting of own) {
        if (currentGuests.includes(meeting.guestKey)) continue;
        otherMeetings.set(`${meeting.guestKey}|${meeting.label}`, { guestKey: meeting.guestKey, label: meeting.label });
      }
      return [{ participantKey, half, groupId: group.id, guestCount, otherMeetings: [...otherMeetings.values()] }];
    });
  }));
}

/** Moving into an occupied slot returns its previous occupant to the roster. */
export function movePerson(round: PairingRound, person: PersonKey, destination: string, slot?: number): PairingRound {
  const source = round.groups.find((g) => g.members.includes(person));
  if (destination && (!round.eligible.includes(person) || !round.groups.some((g) => g.id === destination))) return round;
  if (!destination && !round.eligible.includes(person) && !source) return round;
  if (source?.id === destination && slot === source.members.indexOf(person)) return round;
  const groups = round.groups.map((g) => ({ ...g, members: g.members.filter((key) => key !== person) }));
  const target = groups.find((g) => g.id === destination);
  if (target) {
    const index = slot === undefined ? Math.min(target.members.length, 2) : Math.min(Math.max(slot, 0), target.members.length, 2);
    target.members.splice(index, index < target.members.length ? 1 : 0, person);
  }
  return { ...round, groups };
}

/** Validate a posted plan against the current server-owned eligibility lists. */
export function planAssignments(value: unknown, sessionId: string, eligible: PersonKey[][], { allowIncomplete = false }: { allowIncomplete?: boolean } = {}): Omit<Assignment, "id" | "state">[] | null {
  if (!Array.isArray(value) || value.length !== 2) return null;
  const rows: Omit<Assignment, "id" | "state">[] = [];
  for (const [half, round] of value.entries()) {
    if (!round || !Array.isArray(round.groups) || round.groups.length > 1000) return null;
    const seen = new Set<string>();
    for (const [index, group] of round.groups.entries()) {
      if (!group || !Array.isArray(group.members) || group.members.length > 3 || (!allowIncomplete && group.members.length === 1) || typeof group.location !== "string" || group.location.length > 240) return null;
      for (const personKey of group.members) {
        if (!eligible[half].includes(personKey) || seen.has(personKey)) return null;
        seen.add(personKey);
        rows.push({ sessionId, personKey, group: `S${half + 1} · 1:1 ${String(index + 1).padStart(2, "0")}`, location: group.location, kind: "1:1" });
      }
    }
  }
  return rows;
}
