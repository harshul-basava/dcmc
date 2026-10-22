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
