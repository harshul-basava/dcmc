import PortalShell from "@/components/dashboard/PortalShell";
import PageHeading from "@/components/dashboard/PageHeading";
import Directory from "@/components/dashboard/Directory";
import StatusMark from "@/components/dashboard/StatusMark";
import { hasBio, hasHeadshot, profileComplete } from "@/server/people";
import { requireParticipant } from "@/server/auth";
import { updateProfile } from "./actions";

const ERRORS: Record<string, string> = {
  name: "Give at least a first or last name.",
  type: "Headshots must be a JPEG, PNG or WebP image.",
  size: "That image is larger than 5MB. Please use a smaller one.",
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const me = await requireParticipant("profile");
  const { saved, error } = await searchParams;

  const [firstName = "", ...rest] = me.name.split(" ");
  const lastName = rest.join(" ");

  const field =
    "w-full rounded-card border border-rule bg-surface px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-accent focus:shadow-[0_0_0_4px_rgba(147,51,51,0.10)]";

  return (
    <PortalShell role="participant" active="profile">
      <PageHeading
        title="Your profile"
        lead="This is what other attendees see about you in the directory."
      />

      {/* The directory only lists complete profiles, so say plainly whether
          this one is live and what is missing if it is not. */}
      <div
        className={`mb-8 rounded-card border p-5 ${
          profileComplete(me) ? "border-rule bg-card" : "border-accent bg-[color:var(--red-50)]"
        }`}
      >
        <p className="text-sm text-foreground">
          {profileComplete(me)
            ? "Your profile is live in the attendee directory."
            : "Your profile is not in the attendee directory yet. Complete your profile for it to appear."}
        </p>

        <ul className="mt-4 flex flex-wrap gap-x-8 gap-y-3">
          <li className="flex items-center gap-2.5 text-sm text-muted">
            <StatusMark
              done={hasHeadshot(me)}
              label={hasHeadshot(me) ? "Headshot uploaded" : "No headshot yet"}
            />
            Headshot
          </li>
          <li className="flex items-center gap-2.5 text-sm text-muted">
            <StatusMark done={hasBio(me)} label={hasBio(me) ? "Bio written" : "No bio yet"} />
            Bio
          </li>
        </ul>
      </div>

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
          {ERRORS[error] ?? "Something went wrong. Please try again."}
        </p>
      ) : null}

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
        <form action={updateProfile} className="grid content-start gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-1.5 text-xs text-muted">
              First name
              <input name="firstName" defaultValue={firstName} maxLength={100} className={field} />
            </label>
            <label className="grid gap-1.5 text-xs text-muted">
              Last name
              <input name="lastName" defaultValue={lastName} maxLength={100} className={field} />
            </label>
          </div>

          <label className="grid gap-1.5 text-xs text-muted">
            Headshot
            <input
              type="file"
              name="headshot"
              accept="image/jpeg,image/png,image/webp"
              className="w-full rounded-card border border-rule bg-surface p-2.5 text-sm text-foreground file:mr-3 file:rounded file:border-0 file:bg-[color:var(--neutral-100)] file:px-3 file:py-1.5 file:text-xs file:text-foreground"
            />
            <span className="text-xs text-muted">
              A square or portrait photo works best. JPEG, PNG or WebP, up to 5MB.
              {me.photo ? " Uploading a new one replaces the current photo." : ""}
            </span>
          </label>

          <label className="grid gap-1.5 text-xs text-muted">
            LinkedIn or personal site
            <input
              name="linkedin"
              type="url"
              defaultValue={me.linkedin ?? ""}
              placeholder="https://"
              className={field}
            />
          </label>

          <label className="grid gap-1.5 text-xs text-muted">
            About you
            <textarea
              name="bio"
              rows={8}
              maxLength={4000}
              defaultValue={me.bio}
              className={field}
            />
            <span className="text-xs text-muted">
              A few sentences on what you work on and what you want to get out of the
              conference. Written in the first person reads best.
            </span>
          </label>

          <div>
            <button
              type="submit"
              className="min-h-11 rounded-card bg-accent px-7 text-sm font-semibold text-on-accent transition hover:bg-accent-hover active:scale-[0.97]"
            >
              Save profile
            </button>
          </div>
        </form>

        {/* The real directory components, so the preview cannot drift from the
            thing it is previewing. */}
        <section aria-labelledby="preview" className="content-start">
          <h2 id="preview" className="font-display text-lg tracking-tight text-foreground">
            Directory preview
          </h2>
          <p className="mt-2 text-sm text-muted">
            Your card, and the profile that opens when someone selects it.
          </p>

          <div id="profile-preview" className="mt-5">
            <Directory
              people={[
                {
                  id: me.id,
                  name: me.name,
                  title: me.title,
                  organization: me.organization,
                  bio: me.bio || "No description yet.",
                  photo: me.photo,
                  linkedin: me.linkedin,
                },
              ]}
              anchor="#profile-preview"
            />
          </div>
        </section>
      </div>
    </PortalShell>
  );
}
