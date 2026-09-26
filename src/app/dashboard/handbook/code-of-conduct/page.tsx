import Link from "next/link";
import PortalShell from "@/components/dashboard/PortalShell";
import PageHeading from "@/components/dashboard/PageHeading";
import HandbookBack from "@/components/dashboard/HandbookBack";
import { requireParticipant } from "@/server/auth";
import { conference } from "@/content/site";

/**
 * Adapted from the Lateral Workshop code of conduct.
 *
 * Their organisers' names and personal phone numbers are deliberately not
 * carried over; the reporting routes below are DCMC's own.
 */
export default async function CodeOfConductPage() {
  await requireParticipant("handbook");

  return (
    <PortalShell role="participant" active="handbook" framed={false}>
      {/* The column is centred in the page; the prose inside it stays left
          aligned, the same shape the feedback forms use. */}
      <div className="mx-auto w-full max-w-2xl">
        <HandbookBack />
        <PageHeading title="Code of conduct" />

        <div className=" [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-lg [&_h2]:tracking-tight [&_h2]:text-foreground [&_li]:text-sm [&_li]:leading-relaxed [&_li]:text-muted [&_p]:mt-3 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-muted [&_ul]:mt-3 [&_ul]:grid [&_ul]:gap-2 [&_ul]:pl-5 [&_ul]:list-disc [&_ul_ul]:mt-2">
        <p>
          This code of conduct exists to ensure that people can collaborate in a positive and
          successful way.
        </p>
        <p>
          This is not an exhaustive list of things that you can&rsquo;t do. Rather, it is a
          guide to ensure our community remains safe and productive for all members. This code
          of conduct applies to all participants for the duration of the conference, and
          includes both online and in-person spaces.
        </p>

        <h2>As a participant in {conference.shortName}, you agree to:</h2>
        <ul>
          <li>Respect the boundaries of other organizers and participants</li>
          <li>Respect the confidentiality of other organizers and participants</li>
          <li>Look out for one another and strive to create a welcoming and positive environment</li>
        </ul>

        <h2>These behaviors don&rsquo;t belong in our programs:</h2>
        <ul>
          <li>Offensive or discriminatory actions or communication</li>
          <li>Being disruptive or otherwise undermining others&rsquo; experience in the program</li>
          <li>
            Bullying or threatening, including but not limited to insulting people, putting
            them down, or mocking them
          </li>
          <li>
            Harassment of any kind, including unwelcome sexual attention and inappropriate
            physical contact
          </li>
        </ul>

        <p>
          We understand that human interaction is complex, and that people understand it in
          different ways. Therefore, please assume good intentions and communicate if you find
          another participant&rsquo;s behavior unwelcome or offensive. And if you&rsquo;re
          asked to stop a behavior that&rsquo;s causing a problem for someone, we expect you
          to stop immediately.
        </p>

        <h2>In order to maintain physical safety:</h2>
        <ul>
          <li>If you&rsquo;re feeling sick, please let one of the organizers know.</li>
          <li>
            You&rsquo;re expected to be at the conference for the whole of{" "}
            {conference.shortName}. If you step out, please let at least one person know where
            you&rsquo;re going and for how long.
          </li>
        </ul>

        <h2>Contact us to report any problems:</h2>
        <ul>
          <li>
            Please contact one of the main organizers with any concerns, in person or by call
            or text.
            {/* Liam's and Seth's numbers are not published yet; the lines are
                here so they can be filled in without touching the copy. */}
            <ul>
              <li>
                Harshul Basava:{" "}
                <a href="tel:+14083554218" className="text-accent underline underline-offset-2">
                  +1 (408) 355-4218
                </a>
              </li>
              <li>Liam Robins:</li>
              <li>Seth Lifland:</li>
            </ul>
          </li>
          <li>
            You can contact us anonymously using the anytime form on the{" "}
            <Link href="/dashboard/feedback" className="text-accent underline underline-offset-2">
              feedback page
            </Link>
            .
          </li>
          <li>We will do our best to maintain the confidentiality of complaints whenever feasible.</li>
        </ul>

        <h2>Our commitment:</h2>
        <p>
          We will investigate all incidents reported with discretion and will respond as
          needed. Possible resolutions include giving a warning to the individual, requiring
          them not to interact with another person, or asking them to leave the program.
        </p>
        <p>
          If you have a question, concern, or suggestion about this code of conduct, please
          write to{" "}
          <a
            href={`mailto:${conference.email}`}
            className="text-accent underline underline-offset-2"
          >
            {conference.email}
          </a>
          .
        </p>
        </div>
      </div>
    </PortalShell>
  );
}
