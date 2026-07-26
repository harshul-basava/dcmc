import { conference } from "@/content/site";
import { Container } from "@/components/ui";

/** Shares the ink band with the contact section, separated by a hairline. */
export default function Footer() {
  return (
    <footer data-tone="ink" className="pb-14">
      <Container>
        <div className="flex flex-col gap-6 border-t border-rule pt-10 sm:flex-row sm:items-baseline sm:justify-between">
          <p className="text-sm font-semibold tracking-tight text-foreground">
            {conference.name}
          </p>
          <p className="text-sm text-muted">
            {conference.dates} <span aria-hidden="true">·</span> {conference.location}
          </p>
          <p className="text-xs text-muted">
            &copy; {new Date().getFullYear()} {conference.shortName}
          </p>
        </div>
      </Container>
    </footer>
  );
}
