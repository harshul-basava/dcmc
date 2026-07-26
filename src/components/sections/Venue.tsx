import { conference, venue } from "@/content/site";
import { Eyebrow, Section, SectionHeading } from "@/components/ui";

export default function Venue() {
  return (
    <Section id="venue" tone="sand">
      <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-20">
        <div>
          <Eyebrow>Venue</Eyebrow>
          <SectionHeading>{venue.heading}</SectionHeading>
          <p className="mt-8 text-base leading-[1.8] text-muted sm:text-lg">{venue.body}</p>
        </div>

        <div className="placeholder-frame flex aspect-[5/4] items-center justify-center rounded-card border border-rule">
          <p className="px-6 text-center">
            <span className="block text-xl font-medium text-foreground">
              {conference.location}
            </span>
            <span className="mt-2 block text-xs uppercase tracking-[0.2em] text-muted">
              Venue image to come
            </span>
          </p>
        </div>
      </div>
    </Section>
  );
}
