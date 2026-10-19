import { getGuests, getParticipants } from "./data";
import type { PersonLookup } from "./schedule";

/**
 * An attendee profile is complete once it has both a headshot and a bio.
 * Incomplete attendee profiles are held back from their directory. Guests
 * have a separate, organizer-released directory that does not require bios.
 *
 * One definition, used by the directory, the admin table and the profile page
 * alike, so they can never disagree about who is visible.
 */
export function hasHeadshot(person: { photo?: string }): boolean {
  return Boolean(person.photo);
}

export function hasBio(person: { bio: string }): boolean {
  return person.bio.trim().length > 0;
}

export function profileComplete(person: { photo?: string; bio: string }): boolean {
  return hasHeadshot(person) && hasBio(person);
}

/** Name lookup keyed the way assignments reference people. */
export async function personLookup(): Promise<PersonLookup> {
  const [participants, guests] = await Promise.all([getParticipants(), getGuests()]);
  const map: PersonLookup = new Map();
  for (const p of participants) map.set(`participant:${p.id}`, { name: p.name, isGuest: false });
  for (const g of guests) map.set(`guest:${g.id}`, { name: g.name, isGuest: true });
  return map;
}

/** Initials for the monogram plate that stands in for a missing headshot. */
export function initials(name: string): string {
  return name
    .replace(/^(Dr|Mr|Ms|Mrs|Prof)\.?\s+/i, "")
    .split(/\s+/)
    // Words with no letters (a stray "&", "(TBD)"'s bracket) can't give one.
    .map((part) => part.match(/\p{L}/u)?.[0] ?? "")
    .filter(Boolean)
    .slice(0, 2)
    .map((letter) => letter.toUpperCase())
    .join("");
}
