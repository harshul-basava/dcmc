import { organizers, speakers } from "@/content/site";
import PersonGrid from "@/components/PersonGrid";
import { Eyebrow, Section, SectionHeading, Subheading } from "@/components/ui";

/** Speakers, with the organizing team directly beneath. */
export default function People() {
  return (
    <Section id="speakers" tone="sand">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-end">
        <div>
          <Eyebrow>Speakers</Eyebrow>
          <SectionHeading>Who you&rsquo;ll hear from</SectionHeading>
        </div>
        <p className="max-w-xl text-base leading-[1.75] text-muted lg:pb-2">
          We invite people who work on AI policy day to day — in government, in labs, and
          in the organizations shaping the rules.
        </p>
      </div>

      <div className="mt-14">
        <PersonGrid people={speakers} emptyMessage="Speakers coming soon" />
      </div>

      <div className="mt-24 border-t border-rule pt-14">
        <Subheading>Organizers</Subheading>
        <p className="mt-3 max-w-xl text-base leading-[1.75] text-muted">
          DCMC is run by a small volunteer team of students and early-career researchers.
        </p>
        <div className="mt-12">
          <PersonGrid
            people={organizers}
            emptyMessage="Organizers announced soon"
            ghostCount={3}
          />
        </div>
      </div>
    </Section>
  );
}
