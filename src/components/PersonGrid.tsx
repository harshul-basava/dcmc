import Image from "next/image";
import type { Person } from "@/content/site";
import { ComingSoon } from "@/components/ui";

/**
 * Renders a roster of people, or a "coming soon" panel while the list is empty.
 * People without a `photo` get a monogram tile so a half-filled roster still
 * looks deliberate.
 */
export default function PersonGrid({
  people,
  emptyMessage,
}: {
  people: readonly Person[];
  emptyMessage: string;
}) {
  if (people.length === 0) return <ComingSoon>{emptyMessage}</ComingSoon>;

  return (
    <ul className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
      {people.map((person) => (
        <li key={person.name}>
          <div className="placeholder-frame relative mb-4 aspect-[4/5] overflow-hidden rounded-sm border border-rule">
            {person.photo ? (
              <Image
                src={person.photo}
                alt={person.name}
                fill
                sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 220px"
                className="object-cover"
              />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-2xl font-medium text-accent">
                {initials(person.name)}
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-foreground">{person.name}</p>
          <p className="text-sm text-muted">{person.role}</p>
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
