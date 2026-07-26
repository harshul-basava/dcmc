import { organizers, showOrganizers, speakers } from "@/content/site";
import PersonGrid from "@/components/PersonGrid";
import { Section, SectionHeading, Subheading } from "@/components/ui";

/**
 * Speakers, with the organizing team beneath — the latter hidden until
 * `showOrganizers` is flipped on in the content file.
 */
export default function People() {
  return (
    <Section id="speakers" tone="sand">
      <SectionHeading>Speakers and Guests</SectionHeading>

      <div className="mt-14">
        <PersonGrid people={speakers} emptyMessage="Speakers coming soon" />
      </div>

      {showOrganizers ? (
        <div className="mt-24 border-t border-rule pt-14">
          <Subheading>Organizers</Subheading>
          <p className="mt-3 max-w-xl text-base leading-[1.75] text-muted">
            DCMC is run by a small volunteer team of students and early-career
            researchers.
          </p>
          <div className="mt-12">
            <PersonGrid people={organizers} emptyMessage="Organizers announced soon" />
          </div>
        </div>
      ) : null}
    </Section>
  );
}
