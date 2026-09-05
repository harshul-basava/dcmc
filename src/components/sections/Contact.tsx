import { conference, contact, links, PLACEHOLDER_LINK } from "@/content/site";
import { CTA, Section, SectionHeading } from "@/components/ui";

/** Closing band: future-round interest, then the two ways to get in touch. */
export default function Contact() {
  return (
    <Section id="contact" tone="ink" className="pb-20 sm:pb-24">
      <SectionHeading>Interested in a future round?</SectionHeading>

      <div className="mt-10 flex flex-wrap items-center gap-4">
        <CTA href={links.futureInterest}>
          Express interest <span aria-hidden="true">→</span>
        </CTA>
      </div>

      <div className="mt-20 grid gap-10 border-t border-rule pt-12 sm:grid-cols-2 sm:gap-16">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
            Questions
          </p>
          <p className="mt-4 text-base leading-[1.7] text-muted">
            Please contact{" "}
            <a
              href={`mailto:${conference.email}`}
              className="text-foreground underline underline-offset-4 decoration-gold hover:text-gold"
            >
              {conference.email}
            </a>{" "}
            with any questions or feedback.
          </p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
            For policymakers
          </p>
          <p className="mt-4 text-base leading-[1.7] text-muted">
            {contact.policymakerPrompt}
          </p>
          <div className="mt-5">
            {links.policymakerInterest === PLACEHOLDER_LINK ? (
              <a
                href={`mailto:${conference.email}?subject=Interest%20in%20DCMC%202.0`}
                className="text-sm text-foreground underline underline-offset-4 decoration-gold hover:text-gold"
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
      </div>
    </Section>
  );
}
