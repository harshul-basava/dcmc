import { notFound } from "next/navigation";
import PortalShell from "@/components/dashboard/PortalShell";
import BackLink from "@/components/dashboard/BackLink";
import PageHeading from "@/components/dashboard/PageHeading";
import ProfileStatus from "@/components/dashboard/ProfileStatus";
import DirectoryPreview from "@/components/dashboard/DirectoryPreview";
import GuestProfileForm from "@/components/dashboard/GuestProfileForm";
import { requireAdmin } from "@/server/auth";
import { getGuest } from "@/server/data";
import { GUEST_PROFILE_ERRORS, type GuestProfileError } from "@/server/guest-profile";
import { setGuestDirectoryVisibility, updateGuestProfileAsAdmin } from "./actions";

export default async function AdminGuestProfile({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const guest = await getGuest(id);
  if (!guest) notFound();

  const { saved, error } = await searchParams;
  const firstName = guest.name.replace(/^(Dr|Mr|Ms|Mrs|Prof)\.?\s+/i, "").split(" ")[0];

  return (
    <PortalShell role="admin" active="people">
      <BackLink href="/dashboard/admin/people">All people</BackLink>

      <PageHeading
        title={guest.name}
        lead="Editing this guest's directory profile on their behalf."
      />

      {/* Separate from the profile: an organizer's call about who appears, so
          a "private" guest can be held back however complete they are. */}
      <form
        action={setGuestDirectoryVisibility}
        className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-card border border-rule bg-card p-5"
      >
        <input type="hidden" name="id" value={guest.id} />
        <input type="hidden" name="hidden" value={guest.hidden ? "false" : "true"} />
        <div>
          <p className="text-sm font-medium text-foreground">
            {guest.hidden ? "Hidden from the guest directory" : "Shown in the guest directory"}
          </p>
          <p className="mt-1 text-xs text-muted">
            {guest.hidden
              ? "Attendees can't see this guest, even once the profile is complete."
              : "Attendees see this guest once the profile has a headshot and bio."}
          </p>
        </div>
        <button
          type="submit"
          role="switch"
          aria-checked={!guest.hidden}
          aria-label="Show in the guest directory"
          className={`relative h-7 w-12 shrink-0 rounded-full transition ${
            guest.hidden ? "bg-[color:var(--neutral-200)]" : "bg-accent"
          }`}
        >
          <span
            aria-hidden="true"
            className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
              guest.hidden ? "left-1" : "left-6"
            }`}
          />
        </button>
      </form>

      <ProfileStatus
        person={guest}
        hidden={guest.hidden}
        directory="guest directory"
        subject={`${firstName}'s profile`}
      />

      {saved ? (
        <p className="mb-6 rounded-card border border-rule bg-card p-4 text-sm text-[color:var(--color-success)]">
          Saved.
        </p>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="mb-6 rounded-card border border-accent bg-[color:var(--red-50)] p-4 text-sm text-accent"
        >
          {GUEST_PROFILE_ERRORS[error as GuestProfileError] ??
            "Something went wrong. Please try again."}
        </p>
      ) : null}

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
        <div className="grid content-start gap-5">
          {/* The action needs to know which guest; the route param is not in
              the form body, so it is carried as a hidden field and re-checked
              against the roster server-side. */}
          <GuestProfileForm
            guest={guest}
            action={updateGuestProfileAsAdmin}
            submitLabel="Save profile"
            idField={guest.id}
          />
        </div>

        <DirectoryPreview
          person={guest}
          lead="How this guest will appear to participants once the profile is complete."
        />
      </div>
    </PortalShell>
  );
}
