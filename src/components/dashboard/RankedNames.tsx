"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { OneToOneCandidate } from "@/server/feedback";

/**
 * The ranked 1:1 request list.
 *
 * Order carries meaning — the pairing round reads rank as preference — so the
 * list is explicitly numbered and reorderable rather than a free-text box
 * where the ordering is only implied.
 *
 * Before hydration, and with JavaScript off, this renders a plain textarea
 * instead. The server accepts either, so the question is answerable without
 * client JavaScript like the rest of the dashboard.
 */
export default function RankedNames({
  name,
  candidates,
  max,
  guests,
}: {
  /** Field holding the ordered person keys, one per line. */
  name: string;
  candidates: OneToOneCandidate[];
  max: number;
  /** Shown as chips above the picker, so guest bios are one click away. */
  guests: OneToOneCandidate[];
}) {
  const [picked, setPicked] = useState<OneToOneCandidate[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<OneToOneCandidate | null>(null);
  const dragFrom = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // False while server-rendering and through hydration, true thereafter — the
  // standard way to ask whether the client is actually running yet.
  const live = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const chosen = useMemo(() => new Set(picked.map((p) => p.key)), [picked]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return candidates
      .filter((person) => !chosen.has(person.key))
      .filter(
        (person) =>
          person.name.toLowerCase().includes(q) ||
          person.organization.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [candidates, chosen, query]);

  const add = (person: OneToOneCandidate) => {
    if (picked.length >= max || chosen.has(person.key)) return;
    setPicked([...picked, person]);
    setQuery("");
    setOpen(false);
    inputRef.current?.focus();
  };

  const remove = (key: string) => setPicked(picked.filter((p) => p.key !== key));

  const move = (from: number, to: number) => {
    if (to < 0 || to >= picked.length || from === to) return;
    const next = [...picked];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setPicked(next);
  };

  if (!live) {
    return (
      <textarea
        id={name}
        name={name}
        rows={5}
        className="w-full rounded-card border border-rule bg-surface p-3 text-sm leading-relaxed text-foreground outline-none transition focus:border-accent focus:shadow-[0_0_0_4px_rgba(147,51,51,0.10)]"
        placeholder="One name per line, most wanted first."
      />
    );
  }

  return (
    <div className="grid gap-3">
      {/* The ordered keys, which is what the server actually reads. */}
      <input type="hidden" name={name} value={picked.map((p) => p.key).join("\n")} />

      {guests.length ? (
        <div className="flex flex-wrap gap-1.5">
          {guests.map((guest) => (
            <button
              key={guest.key}
              type="button"
              onClick={() => setProfile(guest)}
              className="rounded bg-[color:var(--neutral-100)] px-2.5 py-1 text-xs text-foreground transition hover:bg-[color:var(--neutral-200)]"
            >
              {guest.name}
            </button>
          ))}
        </div>
      ) : null}

      {picked.length ? (
        <ol className="grid gap-1.5">
          {picked.map((person, index) => (
            <li
              key={person.key}
              draggable
              onDragStart={() => {
                dragFrom.current = index;
              }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                if (dragFrom.current !== null) move(dragFrom.current, index);
                dragFrom.current = null;
              }}
              className="flex items-center gap-2.5 rounded-card border border-rule bg-card px-3 py-2"
            >
              <span className="w-5 shrink-0 text-center text-xs tabular-nums text-muted">
                {index + 1}
              </span>

              <span aria-hidden="true" className="cursor-grab text-muted" title="Drag to reorder">
                ⠿
              </span>

              <button
                type="button"
                onClick={() => setProfile(person)}
                className="min-w-0 flex-1 text-left"
              >
                <strong className="block truncate text-sm font-medium text-foreground">
                  {person.name}
                </strong>
                {person.organization || person.isGuest ? (
                  <span className="block truncate text-xs text-muted">
                    {[person.isGuest ? "Guest" : null, person.organization]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                ) : null}
              </button>

              {/* Drag is not reachable from a keyboard, so rank is also
                  adjustable one step at a time. */}
              <span className="flex shrink-0 items-center gap-0.5">
                <RankButton
                  label={`Move ${person.name} up`}
                  disabled={index === 0}
                  onClick={() => move(index, index - 1)}
                >
                  ↑
                </RankButton>
                <RankButton
                  label={`Move ${person.name} down`}
                  disabled={index === picked.length - 1}
                  onClick={() => move(index, index + 1)}
                >
                  ↓
                </RankButton>
                <RankButton label={`Remove ${person.name}`} onClick={() => remove(person.key)}>
                  ✕
                </RankButton>
              </span>
            </li>
          ))}
        </ol>
      ) : null}

      {picked.length < max ? (
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            // A blur that lands on a suggestion must not close the list first.
            onBlur={() => window.setTimeout(() => setOpen(false), 120)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                if (matches[0]) add(matches[0]);
              }
            }}
            placeholder={picked.length ? "Add another name…" : "Start typing a name…"}
            aria-label="Search attendees and guests"
            autoComplete="off"
            className="w-full rounded-card border border-rule bg-surface px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-accent focus:shadow-[0_0_0_4px_rgba(147,51,51,0.10)]"
          />

          {open && matches.length ? (
            <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-auto rounded-card border border-rule bg-surface py-1 shadow-[0_8px_24px_rgb(32_28_24/14%)]">
              {matches.map((person) => (
                <li key={person.key}>
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => add(person)}
                    className="flex w-full items-baseline gap-2 px-3 py-2 text-left transition hover:bg-[color:var(--neutral-100)]"
                  >
                    <span className="text-sm text-foreground">{person.name}</span>
                    <span className="truncate text-xs text-muted">
                      {[person.isGuest ? "Guest" : null, person.organization]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : (
        <p className="text-xs text-muted">That is {max} names — the most you can list.</p>
      )}

      {profile ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={profile.name}
          className="fixed inset-0 z-50 grid place-items-center p-5"
        >
          <button
            type="button"
            aria-label="Close"
            onClick={() => setProfile(null)}
            className="absolute inset-0 cursor-default bg-[rgb(32_28_24/45%)]"
          />
          <div className="relative w-full max-w-md rounded-card border border-rule bg-surface p-6 shadow-[0_20px_50px_rgb(32_28_24/28%)]">
            <button
              type="button"
              onClick={() => setProfile(null)}
              aria-label="Close"
              className="absolute right-4 top-4 text-sm text-muted transition hover:text-foreground"
            >
              ✕
            </button>

            <p className="text-xs uppercase tracking-[0.1em] text-muted">
              {profile.isGuest ? "Guest" : "Attendee"}
            </p>
            <h2 className="mt-1 font-display text-2xl leading-tight tracking-tight text-foreground">
              {profile.name}
            </h2>
            {profile.title || profile.organization ? (
              <p className="mt-1 text-sm text-muted">
                {[profile.title, profile.organization].filter(Boolean).join(" · ")}
              </p>
            ) : null}

            <p className="mt-4 text-sm leading-relaxed text-muted">
              {profile.bio.trim() || "No bio yet."}
            </p>

            {profile.linkedin ? (
              <a
                href={profile.linkedin}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-block text-sm text-accent underline underline-offset-2"
              >
                LinkedIn or personal site
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function RankButton({
  label,
  onClick,
  disabled = false,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="grid h-7 w-7 place-items-center rounded text-xs text-muted transition hover:bg-[color:var(--neutral-100)] hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}
