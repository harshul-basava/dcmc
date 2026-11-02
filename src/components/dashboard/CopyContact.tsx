"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const subscribe = () => () => {};
const hasClipboard = () => Boolean(navigator.clipboard?.writeText);
const noClipboard = () => false;

/** Optional enhancement: all contact details remain usable without JavaScript. */
export default function CopyContact({ value, label }: { value: string; label: string }) {
  const available = useSyncExternalStore(subscribe, hasClipboard, noClipboard);
  const [status, setStatus] = useState("Copy");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  if (!available) return null;

  async function copy() {
    if (timer.current) clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(value);
      setStatus("Copied");
    } catch {
      setStatus("Select to copy");
    }
    timer.current = setTimeout(() => setStatus("Copy"), 2500);
  }

  return (
    <button type="button" className="speaker-contact-copy" onClick={copy} aria-label={`${status}: ${label}`}>
      <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4">
        <rect x="7" y="7" width="9.5" height="9.5" rx="2" />
        <path d="M13 7V5a1.5 1.5 0 0 0-1.5-1.5h-6A1.5 1.5 0 0 0 4 5v6a1.5 1.5 0 0 0 1.5 1.5H7" />
      </svg>
      <span aria-live="polite">{status}</span>
    </button>
  );
}
