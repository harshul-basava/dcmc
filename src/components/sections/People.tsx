import { organizers, speakers } from "@/content/site";
import PersonGrid from "@/components/PersonGrid";
import { Eyebrow, Section, SectionHeading } from "@/components/ui";

/** Speakers, with the organizing team directly beneath. */
export default function People() {
  return (
    <Section id="speakers">
      <Eyebrow>Speakers</Eyebrow>
      <SectionHeading>Who you&rsquo;ll hear from</SectionHeading>
      <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted">
        We invite people who work on AI policy day to day — in government, in labs, and in
        the organizations shaping the rules.
      </p>

      <div className="mt-12">
        <PersonGrid people={speakers} emptyMessage="Speakers coming soon" />
      </div>

      <div className="mt-20">
        <h3 className="text-xl font-semibold tracking-tight text-foreground">Organizers</h3>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">
          DCMC is run by a small volunteer team of students and early-career researchers.
        </p>
        <div className="mt-10">
          <PersonGrid people={organizers} emptyMessage="Organizers announced soon" />
        </div>
      </div>
    </Section>
  );
}
