import { initials } from "@/server/people";

export type DirectoryPerson = {
  id: string;
  name: string;
  title: string;
  organization: string;
  bio: string;
  photo?: string;
  linkedin?: string;
};

/**
 * Card grid plus one `:target` profile sheet per person. Both the cards and
 * the sheets are plain anchors, so the directory works with JavaScript off.
 *
 * Emails and sign-in phrases are never passed in — this component has no way
 * to render them by accident.
 */
export default function Directory({
  people,
  anchor,
}: {
  people: DirectoryPerson[];
  /** Where the close button returns to. */
  anchor: string;
}) {
  return (
    <>
      {people.length === 0 ? (
        <div className="rounded-card border border-dashed border-rule px-6 py-14 text-center">
          <p className="text-sm text-muted">Nobody to show yet.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-6">
          {people.map((person) => (
            <li key={person.id}>
              <a
                href={`#person-${person.id}`}
                className="group block rounded-card transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {person.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={person.photo}
                    alt=""
                    className="aspect-[4/5] w-full rounded-[5px] object-cover"
                  />
                ) : (
                  <span className="plate" aria-hidden="true">
                    {initials(person.name)}
                  </span>
                )}
                <strong className="mt-4 block font-display text-lg font-medium leading-snug text-foreground group-hover:text-accent">
                  {person.name}
                </strong>
                {person.title ? (
                  <span className="mt-1 block text-sm leading-snug text-muted">{person.title}</span>
                ) : null}
                {person.organization ? (
                  <span className="mt-1 block text-sm leading-snug text-muted">
                    {person.organization}
                  </span>
                ) : null}
              </a>
            </li>
          ))}
        </ul>
      )}

      {people.map((person) => (
        <section
          key={person.id}
          id={`person-${person.id}`}
          className="overlay"
          role="dialog"
          aria-modal="true"
          aria-label={person.name}
        >
          <a className="overlay-backdrop" href={anchor} aria-label="Close" tabIndex={-1} />
          <div className="overlay-dialog overlay-dialog-wide">
            <a className="overlay-close" href={anchor} aria-label="Close">
              ✕
            </a>

            <div className="profile-portrait">
              {person.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={person.photo} alt="" />
              ) : (
                <span className="plate" aria-hidden="true">
                  {initials(person.name)}
                </span>
              )}
            </div>

            <div className="profile-body">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="font-display text-2xl leading-tight tracking-tight text-foreground">
                    {person.name}
                  </h2>
                  {person.title ? (
                    <p className="mt-1.5 text-base leading-snug text-muted">{person.title}</p>
                  ) : null}
                  {person.organization ? (
                    <p className="mt-1.5 text-base leading-snug text-muted">
                      {person.organization}
                    </p>
                  ) : null}
                </div>

                {person.linkedin ? (
                  <a
                    href={person.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${person.name} on LinkedIn`}
                    className="profile-linkedin"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM10 9h3.8v1.7h.05c.53-.95 1.83-1.95 3.77-1.95C21.3 8.75 22 11 22 14.1V21h-4v-6.1c0-1.45-.03-3.32-2.05-3.32-2.05 0-2.36 1.58-2.36 3.21V21h-3.6z" />
                    </svg>
                  </a>
                ) : null}
              </div>

              <p className="mt-6 text-base leading-relaxed text-muted">{person.bio}</p>
            </div>
          </div>
        </section>
      ))}
    </>
  );
}
