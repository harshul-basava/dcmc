import type { ReactNode } from "react";
import { PLACEHOLDER_LINK } from "@/content/site";

/** Consistent horizontal gutters and max width for every section. */
export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-5xl px-6 sm:px-8 ${className}`}>{children}</div>
  );
}

/**
 * A page section. `id` doubles as the scroll anchor and the scroll-spy target,
 * so it must match an entry in `navItems`.
 */
export function Section({
  id,
  children,
  divided = true,
}: {
  id: string;
  children: ReactNode;
  /** Draws a hairline above the section. Off for the first section after the hero. */
  divided?: boolean;
}) {
  return (
    <section id={id} className="scroll-mt-24 py-20 sm:py-28">
      <Container>
        {divided ? <hr className="mb-16 border-0 border-t border-rule" /> : null}
        {children}
      </Container>
    </section>
  );
}

/** Small uppercase label that sits above a section heading. */
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-muted">
      {children}
    </p>
  );
}

export function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
      {children}
    </h2>
  );
}

export function Prose({ children }: { children: ReactNode }) {
  return (
    <p className="max-w-2xl text-base leading-relaxed text-muted sm:text-lg">{children}</p>
  );
}

/**
 * Primary/secondary call to action. A link still pointing at PLACEHOLDER_LINK
 * renders disabled with a "link coming soon" hint rather than silently going
 * nowhere — see TODO.md.
 */
export function CTA({
  href,
  children,
  variant = "primary",
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-sm px-6 py-3 text-sm font-medium tracking-wide transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
  const styles =
    variant === "primary"
      ? "bg-accent text-on-accent hover:bg-accent-hover"
      : "border border-rule text-foreground hover:border-accent hover:text-accent";

  if (href === PLACEHOLDER_LINK) {
    return (
      <span
        aria-disabled="true"
        title="Link coming soon"
        className={`${base} ${styles} cursor-not-allowed opacity-55 ${className}`}
      >
        {children}
      </span>
    );
  }

  return (
    <a href={href} className={`${base} ${styles} ${className}`}>
      {children}
    </a>
  );
}

/** Neutral "we don't have this yet" panel, used by Speakers/Organizers/etc. */
export function ComingSoon({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-sm border border-dashed border-rule px-6 py-12 text-center">
      <p className="text-sm tracking-wide text-muted">{children}</p>
    </div>
  );
}
