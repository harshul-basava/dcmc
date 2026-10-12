import Image from "next/image";
import Link from "next/link";
import PortalShell from "@/components/dashboard/PortalShell";
import { requireParticipant } from "@/server/auth";
import {
  handbookLinks,
  logistics,
  organizers,
  shuffledOrganizers,
  type Segment,
} from "@/content/dashboard";
import { ORGANIZER, rooms } from "@/content/roommates";
import { ProfileContent, type DirectoryPerson } from "@/components/dashboard/Directory";
import { getParticipants } from "@/server/data";
import { handbookResourcesOpen } from "@/server/portal-pages";

/** Copy with emphasis in it, as stored in the content module. */
function render(segments: Segment[]) {
  return segments.map((segment, index) =>
    typeof segment === "string" ? (
      segment
    ) : "link" in segment ? (
      <a
        key={index}
        href={segment.href}
        target="_blank"
        rel="noreferrer"
        className="text-accent underline underline-offset-2"
      >
        {segment.link}
      </a>
    ) : (
      <strong key={index} className="font-medium text-foreground">
        {segment.bold}
      </strong>
    ),
  );
}

export default async function HandbookPage() {
  const me = await requireParticipant("handbook");
  const resourcesOpen = await handbookResourcesOpen();
  // A different order on every load, so no one is permanently first.
  const team = shuffledOrganizers();

  // Current profiles, so a roommate who edits theirs shows as they now are.
  // Organizers appear as photo and name only: never their numbers.
  const room = rooms.find((ids) => ids.includes(me.id));
  const byId = new Map((await getParticipants()).map((p) => [p.id, p]));
  const roommates: Omit<DirectoryPerson, "id">[] = (room ?? [])
    .filter((id) => id !== me.id)
    .flatMap((id) => {
      if (id.startsWith(`${ORGANIZER}:`)) {
        const name = id.slice(ORGANIZER.length + 1);
        const team = organizers.find((o) => o.name === name);
        // A named organizer gets their photo and role; anything else, like
        // "Organizer (TBD)", is shown exactly as written in the pairings.
        return [
          { name, title: team ? "Organizer" : "", organization: "", bio: "", photo: team?.photo },
        ];
      }
      const p = byId.get(id);
      return p
        ? [
            {
              name: p.name,
              title: p.title,
              organization: p.organization,
              bio: p.bio,
              photo: p.photo,
              linkedin: p.linkedin,
            },
          ]
        : [];
    });
  const roommateNames = roommates.map((r) => r.name).join(" and ");

  // The roommate card only appears for attendees who have a room listed.
  const links = handbookLinks.filter(
    (link) =>
      (resourcesOpen || link.href !== "/dashboard/handbook/resources") &&
      (roommates.length > 0 || link.href !== "#roommates"),
  );

  return (
    <PortalShell role="participant" active="handbook">
      <h1
        id="handbook"
        className="mb-6 font-display text-3xl font-normal tracking-[-0.02em] text-foreground"
      >
        Attendee handbook
      </h1>

      {/* One card per line rather than a two-column grid: the entries are a
          list to read down, and their descriptions are long enough that two
          columns cramp them. */}
      <ul className="grid gap-3">
        {links.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              className="block rounded-card border border-rule bg-surface px-6 py-5 transition hover:border-border-strong"
            >
              <strong className="font-display text-lg font-medium tracking-tight text-foreground">
                {link.title}
              </strong>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                {link.href === "#roommates" ? roommateNames : link.body}
              </p>
            </a>
          </li>
        ))}
      </ul>

      {/* Not a card of its own: it already sits inside the handbook panel,
          and a second border around it only boxed a box. */}
      <section className="mt-12 border-t border-rule pt-8">
        <h2 className="font-display text-lg tracking-tight text-foreground">Getting help</h2>
        {/* Full width of the panel: the measure that suits a long document
            leaves a single sentence broken in half across a wide page. */}
        <p className="mt-2 text-sm leading-relaxed text-muted">
          For anything urgent during the conference, or anything you would rather raise privately,
          contact one of the organizers below or submit the anytime form on the{" "}
          <Link href="/dashboard/feedback" className="text-accent underline underline-offset-2">
            feedback page
          </Link>
          .
        </p>

        {/* Seven across on a wide screen: the team reads as one row, and the
            plates stay portrait-sized rather than filling a quarter of it. */}
        <ul className="mt-6 grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-4 lg:grid-cols-7">
          {team.map((person) => (
            <li key={person.name}>
              {person.photo ? (
                <Image
                  src={person.photo}
                  alt=""
                  width={320}
                  height={400}
                  // The slot is about 190px wide on a wide screen and a third
                  // of the viewport on a phone. Without this Next sizes the
                  // derivative from `width` alone and a 2x display gets an
                  // image it has to scale up.
                  sizes="(min-width: 1024px) 200px, (min-width: 640px) 25vw, 33vw"
                  className="w-full rounded-[5px] object-cover"
                  style={{ aspectRatio: "4 / 5" }}
                />
              ) : (
                <span className="plate block w-full" aria-hidden="true" />
              )}

              <strong className="mt-2.5 block text-sm font-medium text-foreground">
                {person.name}
              </strong>
              {person.contact ? (
                person.contact.startsWith("+") ? (
                  <a
                    href={`tel:${person.contact.replace(/[^\d+]/g, "")}`}
                    className="block text-xs text-accent underline underline-offset-2"
                  >
                    {person.contact}
                  </a>
                ) : (
                  <span className="block text-xs text-muted">{person.contact}</span>
                )
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      {/* A `:target` dialog, like the schedule's session popups — opening and
          closing it is the anchor above and CSS, with no client JavaScript. */}
      <section
        id="logistics"
        className="overlay"
        role="dialog"
        aria-modal="true"
        aria-label="Logistics"
      >
        <a className="overlay-backdrop" href="#handbook" aria-label="Close" tabIndex={-1} />
        <div className="overlay-dialog">
          <a className="overlay-close" href="#handbook" aria-label="Close">
            ✕
          </a>

          <h2 className="font-display text-2xl leading-tight tracking-tight text-foreground">
            Logistics
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">{render(logistics.lead)}</p>

          <dl className="mt-6 grid gap-5">
            {logistics.sections.map((section) => (
              <div key={section.title}>
                <dt className="text-sm font-medium text-foreground">{section.title}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-muted">{render(section.body)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* One roommate reads exactly like a directory profile; two or more stack
          in one scrolling sheet. */}
      {roommates.length ? (
        <section
          id="roommates"
          className="overlay"
          role="dialog"
          aria-modal="true"
          aria-label={roommates.length > 1 ? "Your roommates" : "Your roommate"}
        >
          <a className="overlay-backdrop" href="#handbook" aria-label="Close" tabIndex={-1} />
          <div
            className={`overlay-dialog ${roommates.length > 1 ? "overlay-dialog-stack" : "overlay-dialog-wide"}`}
          >
            <a className="overlay-close" href="#handbook" aria-label="Close">
              ✕
            </a>
            {roommates.length > 1 ? (
              roommates.map((person) => (
                <div key={person.name} className="profile-row">
                  <ProfileContent person={person} />
                </div>
              ))
            ) : (
              <ProfileContent person={roommates[0]} />
            )}
          </div>
        </section>
      ) : null}
    </PortalShell>
  );
}
