import StatusMark from "@/components/dashboard/StatusMark";
import { hasBio, hasHeadshot, profileComplete } from "@/server/people";

type Person = { photo?: string; bio: string };

/**
 * Says plainly whether a profile is listed yet, and what is missing if not.
 *
 * Both directories hide incomplete profiles, so this is the only place that
 * tells someone why they cannot find themselves in one. Shared by the
 * attendee and guest editors, and by the organizer editing on their behalf —
 * the rule it reports is the same `profileComplete` the directories filter on.
 */
export default function ProfileStatus({
  person,
  directory,
  subject = "Your profile",
}: {
  person: Person;
  /** e.g. "attendee directory" — named in both the live and pending copy. */
  directory: string;
  /** "Your profile", or "Jakub's profile" when an organizer is editing. */
  subject?: string;
}) {
  const live = profileComplete(person);

  return (
    <div
      className={`mb-8 rounded-card border p-5 ${
        live ? "border-rule bg-card" : "border-accent bg-[color:var(--red-50)]"
      }`}
    >
      <p className="text-sm text-foreground">
        {live
          ? `${subject} is live in the ${directory}.`
          : `${subject} is not in the ${directory} yet. A headshot and a bio are both needed for it to appear.`}
      </p>

      <ul className="mt-4 flex flex-wrap gap-x-8 gap-y-3">
        <li className="flex items-center gap-2.5 text-sm text-muted">
          <StatusMark
            done={hasHeadshot(person)}
            label={hasHeadshot(person) ? "Headshot uploaded" : "No headshot yet"}
          />
          Headshot
        </li>
        <li className="flex items-center gap-2.5 text-sm text-muted">
          <StatusMark done={hasBio(person)} label={hasBio(person) ? "Bio written" : "No bio yet"} />
          Bio
        </li>
      </ul>
    </div>
  );
}
