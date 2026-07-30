import { about } from "@/content/site";
import { Section, SectionHeading } from "@/components/ui";

/** The mission, on the dark band — the visual centerpiece of the page. */
export default function About() {
  return (
    <Section id="about" tone="ink">
      <SectionHeading>{about.heading}</SectionHeading>

      {/* Two columns on desktop keeps dense copy from becoming a wall. */}
      <div className="mt-12 grid gap-8 text-base leading-[1.8] text-muted sm:text-lg lg:grid-cols-2 lg:gap-14">
        {about.body.map((paragraph) => (
          <p key={paragraph.slice(0, 24)}>{paragraph}</p>
        ))}
      </div>
    </Section>
  );
}
