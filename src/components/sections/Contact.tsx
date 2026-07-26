import { conference, contact, links, PLACEHOLDER_LINK } from "@/content/site";
import { CTA, Eyebrow, Section, SectionHeading } from "@/components/ui";

export default function Contact() {
  return (
    <Section id="contact">
      <Eyebrow>Contact</Eyebrow>
      <SectionHeading>{contact.heading}</SectionHeading>

      <p className="mt-8 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
        Please contact{" "}
        <a
          href={`mailto:${conference.email}`}
          className="text-accent underline underline-offset-4 hover:text-accent-hover"
        >
          {conference.email}
        </a>{" "}
        with any questions or feedback.
      </p>

      <div className="mt-12 max-w-2xl border-t border-rule pt-8">
        <p className="text-base leading-relaxed text-foreground">
          {contact.policymakerPrompt}
        </p>
        <div className="mt-6">
          {links.policymakerInterest === PLACEHOLDER_LINK ? (
            <a
              href={`mailto:${conference.email}?subject=Interest%20in%20DCMC%202.0`}
              className="text-sm text-accent underline underline-offset-4 hover:text-accent-hover"
            >
              Email us to express interest <span aria-hidden="true">→</span>
            </a>
          ) : (
            <CTA href={links.policymakerInterest} variant="secondary">
              Express interest <span aria-hidden="true">→</span>
            </CTA>
          )}
        </div>
      </div>
    </Section>
  );
}
