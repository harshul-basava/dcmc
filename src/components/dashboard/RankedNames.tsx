"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
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
/** The `gap-1.5` between rows, in pixels — part of how far a row travels. */
const ROW_GAP = 6;

type Drag = { index: number; offset: number; height: number; count: number };

/** Where the dragged row would land if released now. */
function targetOf(drag: Drag): number {
  if (!drag.height) return drag.index;
  const steps = Math.round(drag.offset / drag.height);
  return Math.min(Math.max(drag.index + steps, 0), drag.count - 1);
}

/**
 * How far a row that is *not* being dragged should slide, so the list opens a
 * gap where the dragged row would land. This is what makes the reorder read
 * as a list rearranging itself rather than an image being carried around.
 */
function shiftFor(index: number, drag: Drag): number {
  if (!drag.height) return 0;
  const target = targetOf(drag);
  if (index > drag.index && index <= target) return -drag.height;
  if (index < drag.index && index >= target) return drag.height;
  return 0;
}

/**
 * The rank to print mid-drag. Without this the numbers keep their original
 * positions while the rows slide past them, so the list briefly reads 2, 1, 3.
 */
function rankFor(index: number, drag: Drag | null): number {
  if (!drag) return index + 1;
  const target = targetOf(drag);
  if (index === drag.index) return target + 1;
  if (index > drag.index && index <= target) return index;
  if (index < drag.index && index >= target) return index + 2;
  return index + 1;
}

export default function RankedNames({
  name,
  candidates,
  max,
}: {
  /** Field holding the ordered person keys, one per line. */
  name: string;
  candidates: OneToOneCandidate[];
  max: number;
}) {
  const [picked, setPicked] = useState<OneToOneCandidate[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<OneToOneCandidate | null>(null);
  /** Which row is being dragged, how far it has travelled, and how tall a
   *  row is — all three are needed to render the rest of the list sliding. */
  const [drag, setDrag] = useState<Drag | null>(null);
  /** The same drag, mutable, so the window listeners never read stale state. */
  const dragRef = useRef<
    { index: number; originY: number; height: number; offset: number; count: number } | null
  >(null);
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

  useEffect(() => {
    if (!drag) return;

    const onMove = (event: PointerEvent) => {
      const current = dragRef.current;
      if (!current) return;
      current.offset = event.clientY - current.originY;
      setDrag({
        index: current.index,
        offset: current.offset,
        height: current.height,
        count: current.count,
      });
    };

    const onUp = () => {
      const current = dragRef.current;
      dragRef.current = null;
      setDrag(null);
      if (!current) return;
      move(current.index, targetOf({ ...current }));
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
    // Re-subscribing on every pointermove would be wasteful; the handlers
    // read the live values from the ref instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag === null]);

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

      {picked.length ? (
        <ol className="grid gap-1.5">
          {picked.map((person, index) => (
            <li
              key={person.key}
              className={`flex items-center gap-2.5 rounded-card border bg-card px-3 py-2 ${
                drag?.index === index
                  ? "relative z-10 border-border-strong shadow-[0_6px_16px_rgb(32_28_24/16%)]"
                  : "border-rule transition-transform duration-150"
              }`}
              style={
                drag
                  ? {
                      transform:
                        index === drag.index
                          ? `translateY(${drag.offset}px)`
                          : `translateY(${shiftFor(index, drag)}px)`,
                    }
                  : undefined
              }
            >
              <span className="w-5 shrink-0 text-center text-xs tabular-nums text-muted">
                {rankFor(index, drag)}
              </span>

              <span
                aria-hidden="true"
                title="Drag to reorder"
                onPointerDown={(event) => {
                  if (event.button !== 0) return;
                  // Otherwise the press starts a text selection that fights
                  // the drag.
                  event.preventDefault();
                  const row = event.currentTarget.closest("li");
                  const height = row ? row.getBoundingClientRect().height + ROW_GAP : 0;
                  dragRef.current = {
                    index,
                    originY: event.clientY,
                    height,
                    offset: 0,
                    count: picked.length,
                  };
                  setDrag({ index, offset: 0, height, count: picked.length });
                }}
                className={`select-none text-muted ${
                  drag?.index === index ? "cursor-grabbing" : "cursor-grab"
                }`}
              >
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
