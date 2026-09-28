"use client";

import { useEffect, useState } from "react";

/** Fired by HeadshotInput with an object URL of the cropped, unsaved photo. */
export const HEADSHOT_DRAFT_EVENT = "headshot-draft";

/**
 * A directory photo, or the initials plate when there is none.
 *
 * In `live` mode it also follows the headshot being cropped on the same page,
 * so the profile preview shows the new crop before it is saved. The real
 * directory never sets `live`, and then this is just the image.
 */
export default function PhotoSlot({
  photo,
  initials,
  imgClassName,
  live = false,
}: {
  photo?: string;
  initials: string;
  imgClassName?: string;
  live?: boolean;
}) {
  const [draft, setDraft] = useState<string | null>(null);

  useEffect(() => {
    if (!live) return;
    const onDraft = (event: Event) => setDraft((event as CustomEvent<string | null>).detail);
    window.addEventListener(HEADSHOT_DRAFT_EVENT, onDraft);
    return () => window.removeEventListener(HEADSHOT_DRAFT_EVENT, onDraft);
  }, [live]);

  const src = draft ?? photo;
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className={imgClassName} />
  ) : (
    <span className="plate" aria-hidden="true">
      {initials}
    </span>
  );
}
