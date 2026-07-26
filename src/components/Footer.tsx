import { conference, links } from "@/content/site";
import { CTA, Container } from "@/components/ui";

export default function Footer() {
  return (
    <footer className="border-t border-rule py-16">
      <Container>
        <div className="flex flex-col gap-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-2xl font-semibold tracking-tight text-foreground">
              {conference.name}
            </p>
            <p className="mt-2 text-sm text-muted">
              {conference.dates} <span aria-hidden="true">·</span> {conference.location}
            </p>
            <a
              href={`mailto:${conference.email}`}
              className="mt-4 inline-block text-sm text-muted underline underline-offset-4 hover:text-foreground"
            >
              {conference.email}
            </a>
          </div>

          <div className="flex flex-wrap gap-4">
            <CTA href={links.apply}>APPLY NOW</CTA>
            <CTA href={links.refer} variant="secondary">
              Refer an applicant
            </CTA>
          </div>
        </div>

        <p className="mt-12 border-t border-rule pt-6 text-xs text-muted">
          &copy; {new Date().getFullYear()} {conference.name}
        </p>
      </Container>
    </footer>
  );
}
