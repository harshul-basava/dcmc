import type { FeedbackQuestion } from "@/server/feedback-questions";
import type { OneToOneGuestOption } from "@/server/feedback";
import { ProfileContent } from "./Directory";
import TextQuestion from "./TextQuestion";

export default function OneToOneRequests({ question, guests }: {
  question: FeedbackQuestion;
  guests: OneToOneGuestOption[];
}) {
  return (
    <section className="grid gap-4">
      <p className="text-sm text-muted">
        Include attendees and guests, with one name per line, most wanted first (up to 10).
        {" "}<a href="/dashboard/directory" target="_blank" rel="noreferrer" className="text-accent underline underline-offset-2">Browse attendee bios</a>.
      </p>
      <div className="grid gap-2">
        <h2 className="text-sm font-medium text-foreground">Saturday 1:1 guest options</h2>
        <p className="text-xs text-muted">Click a name to read their bio.</p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {guests.map((guest, index) => (
            <li key={guest.name}>
              <a href={`#one-to-one-guest-${index}`} className="text-sm text-accent underline underline-offset-2">{guest.name}</a>
            </li>
          ))}
        </ul>
      </div>
      <TextQuestion name="one-on-one-picks" label={question.label} required={question.required}
        rows={7} placeholder={"1. Full name\n2. Full name\n3. Full name"} />
      {guests.map((guest, index) => (
        <section key={guest.name} id={`one-to-one-guest-${index}`} className="overlay" role="dialog" aria-modal="true" aria-label={guest.name}>
          <a className="overlay-backdrop" href="#one-to-one-guest-closed" aria-label="Close" tabIndex={-1} />
          <div className="overlay-dialog overlay-dialog-wide">
            <a className="overlay-close" href="#one-to-one-guest-closed" aria-label="Close">✕</a>
            <ProfileContent person={{
              name: guest.name,
              title: guest.person?.title ?? "",
              organization: guest.person?.organization ?? "",
              photo: guest.person?.photo,
              linkedin: guest.person?.linkedin,
              bio: guest.person?.bio.trim() || "Bio not available yet.",
            }} />
          </div>
        </section>
      ))}
    </section>
  );
}
