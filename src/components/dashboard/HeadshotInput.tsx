"use client";

import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent, type PointerEvent } from "react";
import { HEADSHOT_DRAFT_EVENT } from "./PhotoSlot";

/** The on-screen crop frame, in CSS pixels. 4:5, the directory card's shape. */
const FRAME_W = 240;
const FRAME_H = 300;

/** The saved image: the same 4:5, large enough for the biggest slot it fills. */
const OUT_W = 960;
const OUT_H = 1200;

const MAX_ZOOM = 4;

type Crop = { zoom: number; x: number; y: number };

/**
 * The headshot picker, shared by every profile form.
 *
 * Choosing a photo opens a 4:5 frame to drag and zoom it in. The crop is
 * drawn to a canvas and staged in a hidden file input, which is what the form
 * submits, so the server receives an already-cropped, already-small JPEG.
 * That matters beyond looks: the whole form posts as one Server Action
 * request, which Vercel refuses above 4.5MB, taking the bio down with it.
 *
 * Each new crop is also broadcast to any live PhotoSlot, so the directory
 * preview beside the form shows it before saving.
 *
 * If the browser cannot decode the image (HEIC on some browsers, say), the
 * original is staged unchanged and the server's own checks apply.
 */
export default function HeadshotInput({ className }: { className?: string }) {
  const staged = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<{ bitmap: ImageBitmap; url: string } | null>(null);
  const [crop, setCrop] = useState<Crop>({ zoom: 1, x: 0, y: 0 });
  const drag = useRef<{ id: number; x: number; y: number } | null>(null);
  const draftUrl = useRef<string | null>(null);

  // Scale at zoom 1: the smallest that still covers the frame.
  const base = image ? Math.max(FRAME_W / image.bitmap.width, FRAME_H / image.bitmap.height) : 1;
  const width = image ? image.bitmap.width * base * crop.zoom : 0;
  const height = image ? image.bitmap.height * base * crop.zoom : 0;

  /** Keeps the image covering the frame: no empty edge can be dragged in. */
  function clamp(next: Crop): Crop {
    if (!image) return next;
    const w = image.bitmap.width * base * next.zoom;
    const h = image.bitmap.height * base * next.zoom;
    return {
      zoom: next.zoom,
      x: Math.min(0, Math.max(FRAME_W - w, next.x)),
      y: Math.min(0, Math.max(FRAME_H - h, next.y)),
    };
  }

  function stage(file: File | null) {
    const input = staged.current;
    if (!input) return;
    const files = new DataTransfer();
    if (file) files.items.add(file);
    input.files = files.files;
  }

  function announce(url: string | null) {
    if (draftUrl.current) URL.revokeObjectURL(draftUrl.current);
    draftUrl.current = url;
    window.dispatchEvent(new CustomEvent(HEADSHOT_DRAFT_EVENT, { detail: url }));
  }

  async function pick(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (image) URL.revokeObjectURL(image.url);
    setImage(null);

    if (!file) {
      stage(null);
      announce(null);
      return;
    }

    try {
      const bitmap = await createImageBitmap(file);
      const cover = Math.max(FRAME_W / bitmap.width, FRAME_H / bitmap.height);
      setImage({ bitmap, url: URL.createObjectURL(file) });
      // Centred to start with.
      setCrop({
        zoom: 1,
        x: (FRAME_W - bitmap.width * cover) / 2,
        y: (FRAME_H - bitmap.height * cover) / 2,
      });
    } catch {
      stage(file);
      announce(null);
    }
  }

  // Re-render the crop whenever it settles. Runs after state updates, so it
  // always sees the crop that is on screen.
  useEffect(() => {
    if (!image || drag.current) return;
    let cancelled = false;

    const canvas = document.createElement("canvas");
    canvas.width = OUT_W;
    canvas.height = OUT_H;
    const k = OUT_W / FRAME_W;
    canvas.getContext("2d")?.drawImage(image.bitmap, crop.x * k, crop.y * k, width * k, height * k);

    canvas.toBlob(
      (blob) => {
        if (cancelled || !blob) return;
        stage(new File([blob], "headshot.jpg", { type: "image/jpeg" }));
        announce(URL.createObjectURL(blob));
      },
      "image/jpeg",
      0.88,
    );
    return () => {
      cancelled = true;
    };
    // `width`/`height` derive from `image` and `crop`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image, crop]);

  useEffect(
    () => () => {
      if (draftUrl.current) URL.revokeObjectURL(draftUrl.current);
    },
    [],
  );

  function zoomTo(zoom: number) {
    // Zoom about the frame's centre, so the face stays put.
    const cx = FRAME_W / 2;
    const cy = FRAME_H / 2;
    const ratio = zoom / crop.zoom;
    setCrop(clamp({ zoom, x: cx - (cx - crop.x) * ratio, y: cy - (cy - crop.y) * ratio }));
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d || d.id !== event.pointerId) return;
    const dx = event.clientX - d.x;
    const dy = event.clientY - d.y;
    drag.current = { id: d.id, x: event.clientX, y: event.clientY };
    setCrop((c) => clamp({ ...c, x: c.x + dx, y: c.y + dy }));
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (drag.current?.id !== event.pointerId) return;
    drag.current = null;
    // Nudge state so the render effect runs now that the drag has settled.
    setCrop((c) => ({ ...c }));
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? 20 : 5;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [step, 0],
      ArrowRight: [-step, 0],
      ArrowUp: [0, step],
      ArrowDown: [0, -step],
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    setCrop((c) => clamp({ ...c, x: c.x + move[0], y: c.y + move[1] }));
  }

  return (
    <>
      {/* Its wrapper is a div, not a label: a label would reopen the picker on
          every click in the crop frame below. */}
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        aria-label="Headshot"
        onChange={pick}
        className={className}
      />
      {/* What the form actually submits. Never shown; filled from the crop. */}
      <input ref={staged} type="file" name="headshot" hidden tabIndex={-1} aria-hidden="true" />

      {image ? (
        <div className="mt-2 flex flex-wrap items-end gap-5">
          <div
            role="img"
            aria-label="Headshot crop. Drag, or use the arrow keys, to reposition."
            tabIndex={0}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onKeyDown={onKeyDown}
            className="relative shrink-0 cursor-grab touch-none select-none overflow-hidden rounded-[5px] border border-rule bg-[color:var(--neutral-100)] outline-none focus-visible:border-accent active:cursor-grabbing"
            style={{ width: FRAME_W, height: FRAME_H }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.url}
              alt=""
              draggable={false}
              className="pointer-events-none absolute max-w-none"
              style={{ left: crop.x, top: crop.y, width, height }}
            />
          </div>

          <div className="grid min-w-40 flex-1 gap-3">
            <label className="grid gap-1.5 text-xs text-muted">
              Zoom
              <input
                type="range"
                min={1}
                max={MAX_ZOOM}
                step={0.01}
                value={crop.zoom}
                onChange={(event) => zoomTo(Number(event.currentTarget.value))}
                className="w-full accent-[color:var(--color-accent)]"
              />
            </label>
            <p className="text-xs leading-relaxed text-muted">
              Drag the photo to position it in the frame. The preview shows how it will look;
              select your card there to see the full profile.
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
