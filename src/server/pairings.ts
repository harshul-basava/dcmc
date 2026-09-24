import type { Assignment, ConversationPreference, PersonKey } from "./data/types";
import { PAIRING_EXCLUDED } from "./data/types";

/**
 * One-on-one and small-group generation.
 *
 * The scoring is carried over from the AI risk workshop dashboard, where it
 * was tuned against a real cohort: a strong pull toward people who asked for
 * each other, a smaller nudge toward cross-role pairs, and a penalty that
 * spreads conversations evenly rather than letting a few popular people absorb
 * all of them.
 */

/** A rank of 1 is worth the most; the value decays and then floors at 25. */
function rankPoints(rank: number | undefined): number {
  return rank ? Math.max(25, 420 - rank * 40) : 0;
}

const MUTUAL_BONUS = 180;
const CROSS_ROLE_BONUS = 8;
const BASE = 1;
/** Each conversation a person already has makes another one less attractive. */
const LOAD_PENALTY = 24;

const roleOf = (key: PersonKey) => key.split(":")[0];

export function excludedFrom(assignments: Assignment[], sessionId: string): Set<string> {
  return new Set(
    assignments
      .filter((a) => a.sessionId === sessionId && a.group === PAIRING_EXCLUDED)
      .map((a) => a.personKey),
  );
}

/**
 * Two greedy rounds over the same roster — the two halves of a 1:1 block.
 * Nobody is paired with the same person twice, and each round takes the
 * highest-scoring edge that doesn't conflict with one already taken.
 */
export function generateOneToOne({
  sessionId,
  roster,
  preferences,
  existingCounts = new Map(),
  location = "",
}: {
  sessionId: string;
  roster: PersonKey[];
  preferences: ConversationPreference[];
  existingCounts?: Map<string, number>;
  location?: string;
}): Omit<Assignment, "id" | "state">[] {
  const ranks = new Map<string, number>();
  for (const p of preferences) ranks.set(`${p.sourceKey}>${p.targetKey}`, p.rank);

  const counts = new Map(existingCounts);
  const usedPairs = new Set<string>();
  const rows: Omit<Assignment, "id" | "state">[] = [];

  const pairKey = (a: PersonKey, b: PersonKey) => [a, b].sort().join("|");

  for (const half of ["S1", "S2"] as const) {
    // Score every possible pair for this round.
    const edges: { a: PersonKey; b: PersonKey; score: number }[] = [];
    for (let i = 0; i < roster.length; i += 1) {
      for (let j = i + 1; j < roster.length; j += 1) {
        const a = roster[i];
        const b = roster[j];
        if (usedPairs.has(pairKey(a, b))) continue;

        const forward = ranks.get(`${a}>${b}`);
        const backward = ranks.get(`${b}>${a}`);
        let score = BASE + rankPoints(forward) + rankPoints(backward);
        if (forward && backward) score += MUTUAL_BONUS;
        if (roleOf(a) !== roleOf(b)) score += CROSS_ROLE_BONUS;

        edges.push({ a, b, score });
      }
    }

    edges.sort(
      (x, y) =>
        y.score -
        LOAD_PENALTY * ((counts.get(y.a) ?? 0) + (counts.get(y.b) ?? 0)) -
        (x.score - LOAD_PENALTY * ((counts.get(x.a) ?? 0) + (counts.get(x.b) ?? 0))),
    );

    const occupied = new Set<PersonKey>();
    let pair = 0;
    for (const edge of edges) {
      if (occupied.has(edge.a) || occupied.has(edge.b)) continue;
      occupied.add(edge.a);
      occupied.add(edge.b);
      usedPairs.add(pairKey(edge.a, edge.b));
      pair += 1;

      const group = `${half} · 1:1 ${String(pair).padStart(2, "0")}`;
      for (const person of [edge.a, edge.b]) {
        counts.set(person, (counts.get(person) ?? 0) + 1);
        rows.push({
          sessionId,
          personKey: person,
          group,
          location: location || `Room ${pair}`,
          kind: "1:1",
        });
      }
    }
  }

  return rows;
}

/**
 * Balanced small groups. Guests are dealt out first so each group gets one
 * before anyone gets two, then attendees fill in round-robin.
 */
export function generateSmallGroups({
  sessionId,
  roster,
  size,
}: {
  sessionId: string;
  roster: PersonKey[];
  size: number;
}): Omit<Assignment, "id" | "state">[] {
  const clamped = Math.min(12, Math.max(2, size));
  const count = Math.max(1, Math.ceil(roster.length / clamped));

  const guests = roster.filter((key) => roleOf(key) === "guest");
  const others = roster.filter((key) => roleOf(key) !== "guest");
  const ordered = [...guests, ...others];

  return ordered.map((personKey, index) => {
    const group = index % count;
    return {
      sessionId,
      personKey,
      group: `Group ${String.fromCharCode(65 + group)}`,
      location: `Breakout ${group + 1}`,
      kind: "Small group" as const,
    };
  });
}

/** How many conversations each person already has, across every session. */
export function conversationCounts(assignments: Assignment[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const a of assignments) {
    if (a.group === PAIRING_EXCLUDED) continue;
    counts.set(a.personKey, (counts.get(a.personKey) ?? 0) + 1);
  }
  return counts;
}
