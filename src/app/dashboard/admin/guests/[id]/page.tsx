import { notFound } from "next/navigation";
import PortalShell from "@/components/dashboard/PortalShell";
import PageHeading from "@/components/dashboard/PageHeading";
import ProfileStatus from "@/components/dashboard/ProfileStatus";
import DirectoryPreview from "@/components/dashboard/DirectoryPreview";
import GuestProfileForm from "@/components/dashboard/GuestProfileForm";
import { requireAdmin } from "@/server/auth";
import { getGuest } from "@/server/data";
import { GUEST_PROFILE_ERRORS, type GuestProfileError } from "@/server/guest-profile";
import { updateGuestProfileAsAdmin } from "./actions";

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
      <a
        href="/dashboard/admin/people"
        className="mb-4 inline-block text-sm text-muted transition hover:text-foreground"
      >
        &lt; All people
      </a>

      <PageHeading
        title={guest.name}
        lead="Editing this guest's directory profile on their behalf."
      />

      <ProfileStatus
        person={guest}
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
