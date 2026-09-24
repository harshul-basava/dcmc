import type { Guest } from "@/server/data/types";

const field =
  "w-full rounded-card border border-rule bg-surface px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-accent focus:shadow-[0_0_0_4px_rgba(147,51,51,0.10)]";

const label = "grid gap-1.5 text-xs text-muted";

/**
 * The guest directory profile fields.
 *
 * One component for both editors — the guest filling in their own, and an
 * organizer filling it in for them — so the two can never offer different
 * fields or different limits. The name is a single field because the RSVP
 * table stores it in one column, unlike the attendee roster's first/last.
 */
export default function GuestProfileForm({
  guest,
  action,
  submitLabel = "Save profile",
  idField,
  bioHint = "A few sentences participants will read before meeting you. Written in the third person reads best for speakers.",
}: {
  guest: Guest;
  action: (formData: FormData) => void | Promise<void>;
  submitLabel?: string;
  /** Set when an organizer is editing: names which guest the action applies
   *  to, since the route param is not part of the form body. */
  idField?: string;
  bioHint?: string;
}) {
  return (
    <form action={action} className="grid content-start gap-5">
      {idField ? <input type="hidden" name="id" value={idField} /> : null}

      <label className={label}>
        Full name
        <input name="name" defaultValue={guest.name} maxLength={200} className={field} />
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className={label}>
          Role
          <input
            name="title"
            defaultValue={guest.title}
            maxLength={200}
            placeholder="Director of AI Policy"
            className={field}
          />
        </label>
        <label className={label}>
          Affiliation
          <input
            name="organization"
            defaultValue={guest.organization}
            maxLength={200}
            placeholder="Institute for Progress"
            className={field}
          />
        </label>
      </div>

      <label className={label}>
        Headshot
        <input
          type="file"
          name="headshot"
          accept="image/jpeg,image/png,image/webp"
          className="w-full rounded-card border border-rule bg-surface p-2.5 text-sm text-foreground file:mr-3 file:rounded file:border-0 file:bg-[color:var(--neutral-100)] file:px-3 file:py-1.5 file:text-xs file:text-foreground"
        />
        <span className="text-xs text-muted">
          A square or portrait photo works best. JPEG, PNG or WebP, up to 5MB.
          {guest.photo ? " Uploading a new one replaces the current photo." : ""}
        </span>
      </label>

      <label className={label}>
        LinkedIn or personal site
        <input
          name="linkedin"
          type="url"
          defaultValue={guest.linkedin ?? ""}
          placeholder="https://"
          className={field}
        />
      </label>

      <label className={label}>
        Bio
        <textarea name="bio" rows={8} maxLength={4000} defaultValue={guest.bio} className={field} />
        <span className="text-xs text-muted">{bioHint}</span>
      </label>

      <div>
        <button
          type="submit"
          className="min-h-11 rounded-card bg-accent px-7 text-sm font-semibold text-on-accent transition hover:bg-accent-hover active:scale-[0.97]"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
