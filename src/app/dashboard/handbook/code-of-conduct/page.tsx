import PortalShell from "@/components/dashboard/PortalShell";
import PageHeading from "@/components/dashboard/PageHeading";
import HandbookBack from "@/components/dashboard/HandbookBack";
import { requireParticipant } from "@/server/auth";
import { conference } from "@/content/site";

export default async function CodeOfConductPage() {
  await requireParticipant("handbook");

  return (
    <PortalShell role="participant" active="handbook" framed={false}>
      <HandbookBack />
      <PageHeading title="Code of conduct" />

      <div className="max-w-2xl [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-lg [&_h2]:tracking-tight [&_h2]:text-foreground [&_li]:text-sm [&_li]:leading-relaxed [&_li]:text-muted [&_p]:mt-3 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-muted [&_ul]:mt-3 [&_ul]:grid [&_ul]:gap-2 [&_ul]:pl-5 [&_ul]:list-disc">
        <p>
          {conference.name} brings together people at very different stages of their careers.
          That only works if everyone here can speak freely and be taken seriously. This
          document is the short version of what that requires.
        </p>

        <h2>What we expect</h2>
        <ul>
          <li>Treat every attendee, guest, and member of venue staff with respect.</li>
          <li>
            Assume the people you disagree with have thought about it. Argue with the
            strongest version of their position.
          </li>
          <li>
            Conversations here are on the record for you and off the record for everyone
            else: do not attribute anything to a named person outside the conference without
            asking them first.
          </li>
          <li>Accept that no means no — for a conversation, a photograph, or a follow-up.</li>
        </ul>

        <h2>What is not acceptable</h2>
        <ul>
          <li>Harassment, intimidation, or discrimination of any kind.</li>
          <li>Unwanted physical contact or sustained unwanted attention.</li>
          <li>Recording a session or a private conversation without the consent of everyone in it.</li>
          <li>Using the directory or the pairings to solicit, recruit, or sell.</li>
        </ul>

        <h2>Reporting</h2>
        <p>
          Tell any organiser, or write to{" "}
          <a href={`mailto:${conference.email}`} className="text-accent underline underline-offset-2">
            {conference.email}
          </a>
          . Reports go only to the organising team. You can ask us to act without naming you,
          and we will tell you what we intend to do before we do it.
        </p>

        <h2>Consequences</h2>
        <p>
          Depending on what happened, we may ask someone to stop, move them out of a session
          or a pairing, or ask them to leave without a refund. Serious cases are reported to
          the venue or to law enforcement. Organisers make these calls, and they are final for
          the duration of the conference.
        </p>
      </div>
    </PortalShell>
  );
}
