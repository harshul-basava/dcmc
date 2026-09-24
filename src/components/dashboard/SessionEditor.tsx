import type { Session, SessionType } from "@/server/data/types";
import { removeProgramSession, saveProgramSession } from "@/app/dashboard/admin/actions";

const TYPES: SessionType[] = [
  "talk",
  "panel",
  "workshop",
  "one-to-one",
  "small-group",
  "meal",
  "social",
  "break",
  "logistics",
];

/**
 * Create and edit panel, opened by `?new=1` or `?edit=<id>`.
 *
 * Driven by the query string rather than client state, so it is server
 * rendered, survives a reload, and can be linked to directly — and only one
 * form exists in the document no matter how many events there are.
 */
export default function SessionEditor({
  session,
  base,
}: {
  session: Session | null;
  base: string;
}) {
  const field =
    "w-full rounded-card border border-rule bg-surface px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-accent focus:shadow-[0_0_0_4px_rgba(147,51,51,0.10)]";
  const labelClass = "grid gap-1.5 text-xs font-semibold text-muted";

  return (
    <div className="editor-overlay">
      <a href={base} className="editor-backdrop" aria-label="Close editor" tabIndex={-1} />

      <div className="editor-panel" role="dialog" aria-modal="true" aria-label={session ? "Edit event" : "Create an event"}>
        <header className="editor-head">
          <h2 className="font-display text-xl tracking-tight text-foreground">
            {session ? "Edit event" : "Create an event"}
          </h2>
          <a href={base} className="overlay-close" aria-label="Close">
            ✕
          </a>
        </header>

        <form action={saveProgramSession} className="editor-body" id="session-form">
          {session ? <input type="hidden" name="id" value={session.id} /> : null}

          <label className={labelClass}>
            Event name
            <input name="title" required maxLength={240} defaultValue={session?.title} className={field} autoFocus />
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className={labelClass}>
              Starts
              <input type="datetime-local" name="start" required defaultValue={session?.start} className={field} />
            </label>
            <label className={labelClass}>
              Ends
              <input type="datetime-local" name="end" required defaultValue={session?.end} className={field} />
            </label>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className={labelClass}>
              Type
              <select name="type" defaultValue={session?.type ?? "talk"} className={field}>
                {TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              Track
              <input name="track" maxLength={100} defaultValue={session?.track} placeholder="Plenary" className={field} />
            </label>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className={labelClass}>
              Status
              <select name="status" defaultValue={session?.status ?? "confirmed"} className={field}>
                <option value="confirmed">Confirmed</option>
                <option value="tentative">Tentative</option>
              </select>
            </label>
            <label className={labelClass}>
              Location
              <input name="location" maxLength={240} defaultValue={session?.location} placeholder="Room or venue" className={field} />
            </label>
          </div>

          <label className={labelClass}>
            Slido link
            <input type="url" name="slidoUrl" defaultValue={session?.slidoUrl} placeholder="https://app.sli.do/event/…" className={field} />
            <span className="font-normal text-muted">
              Optional. Shown only inside the attendee session details.
            </span>
          </label>

          <label className={labelClass}>
            Speakers or facilitators
            <input name="speaker" maxLength={240} defaultValue={session?.speaker} placeholder="Names separated by commas" className={field} />
          </label>

          <label className={labelClass}>
            Attendee-facing details
            <textarea name="description" rows={4} maxLength={4000} defaultValue={session?.description} placeholder="Optional" className={field} />
          </label>
        </form>

        <footer className="editor-foot">
          {/* Its own form: a delete button inside the edit form would submit
              that form instead. */}
          {session ? (
            <form action={removeProgramSession}>
              <input type="hidden" name="id" value={session.id} />
              <button
                type="submit"
                className="min-h-11 rounded-card px-4 text-sm text-muted underline underline-offset-2 transition hover:text-accent"
              >
                Delete event
              </button>
            </form>
          ) : (
            <span />
          )}

          <span className="flex items-center gap-3">
            <a href={base} className="min-h-11 rounded-card px-4 py-3 text-sm text-muted transition hover:text-foreground">
              Cancel
            </a>
            <button
              type="submit"
              form="session-form"
              className="min-h-11 rounded-card bg-[color:var(--ink)] px-6 text-sm font-semibold text-[color:var(--neutral-50)] transition hover:opacity-90"
            >
              {session ? "Save event" : "Create event"}
            </button>
          </span>
        </footer>
      </div>
    </div>
  );
}
