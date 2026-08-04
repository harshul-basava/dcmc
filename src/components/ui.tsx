import type { ReactNode } from "react";
import { PLACEHOLDER_LINK } from "@/content/site";

export type Tone = "sand" | "surface" | "ink";

/** Consistent horizontal gutters and max width for every section. */
export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-[86rem] px-6 ${className}`}>{children}</div>
  );
}

/**
 * A full-bleed page band. `tone` sets the background and, for "ink", flips the
 * foreground/muted/rule variables so the same children work on a dark band.
 *
 * `id` doubles as the scroll anchor and the scroll-spy target, so it must match
 * an entry in `navItems`.
 */
export function Section({
  id,
  tone = "sand",
  children,
  className = "",
}: {
  id: string;
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      data-tone={tone}
      className={`scroll-mt-20 py-24 sm:py-32 ${className}`}
    >
      <Container>{children}</Container>
    </section>
  );
}

export function SectionHeading({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={`max-w-3xl font-display text-[clamp(2rem,3.8vw,3.1rem)] font-normal leading-[1.14] tracking-[-0.015em] text-foreground ${className}`}
    >
      {children}
    </h2>
  );
}

export function Subheading({ children }: { children: ReactNode }) {
  return (
    <h3 className="font-display text-xl font-normal tracking-tight text-foreground sm:text-2xl">
      {children}
    </h3>
  );
}

export function Lead({ children }: { children: ReactNode }) {
  return (
    <p className="max-w-2xl text-lg leading-[1.7] text-muted sm:text-xl">{children}</p>
  );
}

/** Bordered panel on the current tone. Used for people, quotes, and dates. */
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-card border border-rule bg-card p-6 sm:p-7 ${className}`}
    >
      {children}
    </div>
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
    "group inline-flex min-h-11 items-center justify-center gap-2 rounded-card px-7 py-3.5 font-sans text-sm font-semibold tracking-[0.01em] transition-[color,background-color,box-shadow,transform] duration-150 ease-out active:scale-[0.96] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
  const styles =
    variant === "primary"
      ? "bg-accent text-on-accent shadow-[0_1px_2px_rgba(0,0,0,0.12),0_6px_16px_-10px_rgba(78,24,28,0.65)] hover:bg-accent-hover"
      : "text-foreground shadow-[0_0_0_1px_rgba(0,0,0,0.12),0_1px_2px_-1px_rgba(0,0,0,0.08)] hover:text-accent hover:shadow-[0_0_0_1px_rgba(147,51,51,0.55),0_1px_2px_-1px_rgba(0,0,0,0.08)]";

  if (href === PLACEHOLDER_LINK) {
    return (
      <span
        aria-disabled="true"
        title="Link coming soon"
        className={`${base} ${styles} cursor-not-allowed opacity-50 ${className}`}
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
    <div className="rounded-card border border-dashed border-rule px-6 py-14 text-center">
      <p className="text-sm tracking-[0.08em] text-muted">{children}</p>
    </div>
  );
}
