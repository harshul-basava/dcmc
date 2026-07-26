import Image from "next/image";
import type { Person } from "@/content/site";

/**
 * Renders a roster of people, or a single line while the list is empty. People
 * without a `photo` get a monogram tile, so a half-filled roster still looks
 * deliberate.
 */
export default function PersonGrid({
  people,
  emptyMessage,
}: {
  people: readonly Person[];
  emptyMessage: string;
}) {
  if (people.length === 0) {
    return <p className="text-base tracking-[0.02em] text-muted">{emptyMessage}</p>;
  }

  return (
    <ul className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
      {people.map((person) => (
        <li key={person.name}>
          <div className="placeholder-frame relative mb-4 aspect-[4/5] overflow-hidden rounded-card border border-rule">
            {person.photo ? (
              <Image
                src={person.photo}
                alt={person.name}
                fill
                sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 240px"
                className="object-cover"
              />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-2xl font-medium text-accent">
                {initials(person.name)}
              </span>
            )}
          </div>
          <p className="text-[15px] font-semibold text-foreground">{person.name}</p>
          <p className="mt-0.5 text-sm text-muted">{person.role}</p>
          {person.affiliation ? (
            <p className="text-sm text-muted">{person.affiliation}</p>
          ) : null}
          {person.bio ? (
            <p className="mt-2 text-sm leading-relaxed text-muted">{person.bio}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
