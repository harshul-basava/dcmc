import { about, whoShouldApply } from "@/content/site";
import { Section, SectionHeading } from "@/components/ui";

/**
 * The mission, on the dark band — the visual centerpiece of the page — followed
 * by the "who should apply" cards back on a light band.
 */
export default function About() {
  return (
    <>
      <Section id="about" tone="ink">
        <SectionHeading>{about.heading}</SectionHeading>

        {/* Two columns on desktop keeps dense copy from becoming a wall. */}
        <div className="mt-12 grid gap-8 text-base leading-[1.8] text-muted sm:text-lg lg:grid-cols-2 lg:gap-14">
          {about.body.map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
        </div>
      </Section>

      <Section id="who" tone="surface">
        <SectionHeading>{whoShouldApply.intro}</SectionHeading>

        <ul className="mt-14 grid gap-8 sm:grid-cols-3">
          {whoShouldApply.columns.map((column, index) => (
            <li key={column.title} className="border-t border-rule pt-6">
              <span className="text-sm font-medium tabular-nums text-gold">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h4 className="mt-4 text-lg font-semibold tracking-tight text-foreground">
                {column.title}
              </h4>
              <p className="mt-3 text-[15px] leading-[1.7] text-muted">{column.body}</p>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
