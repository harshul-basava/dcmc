import { conference, venue } from "@/content/site";
import { Eyebrow, Section, SectionHeading } from "@/components/ui";

export default function Venue() {
  return (
    <Section id="venue">
      <Eyebrow>Venue</Eyebrow>
      <SectionHeading>{venue.heading}</SectionHeading>

      <div className="mt-10 grid gap-10 md:grid-cols-2 md:items-center">
        <p className="text-base leading-[1.75] text-muted sm:text-lg">{venue.body}</p>
        <div className="placeholder-frame flex aspect-[4/3] items-center justify-center rounded-sm border border-rule">
          <p className="px-6 text-center text-sm text-muted">
            {conference.location}
            <span className="mt-1 block text-xs uppercase tracking-[0.18em]">
              Venue image to come
            </span>
          </p>
        </div>
      </div>
    </Section>
  );
}
