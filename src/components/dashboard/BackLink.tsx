/**
 * The one way back out of a child page.
 *
 * A single component rather than a chevron repeated at each call site, so
 * every "back" in the dashboard is the same shape, weight and spacing —
 * these used to be a chevron in one place, a literal `<` in another and an
 * arrow in a third.
 */
export default function BackLink({ href, children }: { href: string; children: string }) {
  return (
    <a
      href={href}
      className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        width="13"
        height="13"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10 3L5 8l5 5" />
      </svg>
      {children}
    </a>
  );
}
