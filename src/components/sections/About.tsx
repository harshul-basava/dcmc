import { about, links, PLACEHOLDER_LINK } from "@/content/site";
import { Section, SectionHeading } from "@/components/ui";

/** The mission, on the dark band — the visual centerpiece of the page. */
export default function About() {
  const { callout } = about;

  return (
    <Section id="about" tone="ink">
      <SectionHeading>{about.heading}</SectionHeading>

      {/* Mission on the left, the who-this-is-for callout beside it. */}
      <div className="mt-12 grid gap-12 text-base leading-[1.8] sm:text-lg lg:grid-cols-2 lg:gap-14">
        <p className="text-muted">{about.body}</p>

        <div>
          <p className="text-foreground">{callout.lead}</p>
          <ul className="mt-4 list-disc space-y-3 pl-5 text-muted marker:text-gold">
            {callout.bullets.map((bullet) => (
              <li key={bullet.slice(0, 24)}>{bullet}</li>
            ))}
          </ul>
          <p className="mt-6 text-foreground">
            {callout.closingPrefix}
            {links.apply === PLACEHOLDER_LINK ? (
              <span
                title="Application link coming soon"
                className="cursor-not-allowed underline decoration-gold underline-offset-4 opacity-60"
              >
                {callout.closingLink}
              </span>
            ) : (
              <a
                href={links.apply}
                className="underline decoration-gold underline-offset-4 hover:text-gold"
              >
                {callout.closingLink}
              </a>
            )}
            .
          </p>
        </div>
      </div>
    </Section>
  );
}
