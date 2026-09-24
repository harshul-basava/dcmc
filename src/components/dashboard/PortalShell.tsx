import Image from "next/image";
import type { ReactNode } from "react";
import { signOut } from "@/app/dashboard/actions";
import { conference } from "@/content/site";
import { Container } from "@/components/ui";
import { ADMIN_PAGES, portalPagesFor } from "@/server/portal-pages";
import type { Role } from "@/server/data/types";

type NavItem = { key: string; path: string; label: string };

/**
 * The frame every signed-in page sits in: an ink header carrying the wordmark,
 * the role's nav, and sign-out, over a sand page body.
 *
 * The mobile nav is a native <details> disclosure rather than a client
 * component — the whole dashboard is built to work before any JavaScript
 * loads, and a menu is the last thing worth breaking that for.
 */
export default async function PortalShell({
  role,
  active,
  framed,
  children,
}: {
  role: Role;
  active: string;
  /** Override the frame. Long-form pages read better set plainly on the page. */
  framed?: boolean;
  children: ReactNode;
}) {
  const items: NavItem[] =
    role === "admin" ? ADMIN_PAGES : (await portalPagesFor(role)).map(({ key, path, label }) => ({ key, path, label }));

  const home = role === "admin" ? "/dashboard/admin" : (items[0]?.path ?? "/dashboard");

  // Admin stays flat by default: it is an operations tool, and its tables and
  // metric rows read better without a frame competing for attention.
  const isFramed = framed ?? role !== "admin";

  return (
    <div className={`min-h-screen ${isFramed ? "portal-backdrop" : "bg-sand"}`}>
      <header data-tone="ink" className="sticky top-0 z-50 border-b border-rule">
        <Container>
          <div className="flex h-16 items-center gap-6">
            <a
              href={home}
              aria-label={`${conference.shortName} dashboard`}
              className="flex shrink-0 items-center gap-2.5"
            >
              {/* The mark is navy on navy here, so a faint ring keeps its edge. */}
              <Image
                src="/dcmc-logo.png"
                alt=""
                width={512}
                height={512}
                priority
                className="h-9 w-9 rounded-[5px] ring-1 ring-white/15"
              />
              {role === "admin" ? (
                <span className="text-sm font-semibold text-accent">Admin</span>
              ) : null}
            </a>

            <nav aria-label="Dashboard" className="hidden items-center gap-6 md:flex">
              {items.map((item) => (
                <a
                  key={item.key}
                  href={item.path}
                  aria-current={item.key === active ? "page" : undefined}
                  className={`relative py-1 text-sm transition-colors hover:text-foreground ${
                    item.key === active ? "text-foreground" : "text-muted"
                  }`}
                >
                  {item.label}
                  {item.key === active ? (
                    <span aria-hidden="true" className="absolute inset-x-0 -bottom-0.5 h-px bg-gold" />
                  ) : null}
                </a>
              ))}
            </nav>

            <div className="ml-auto flex items-center gap-2">
              <details className="relative md:hidden">
                <summary className="cursor-pointer list-none p-2 text-sm text-muted [&::-webkit-details-marker]:hidden">
                  Menu
                </summary>
                <nav
                  aria-label="Dashboard"
                  className="absolute right-0 z-50 mt-2 w-56 rounded-card border border-rule bg-ink p-2 shadow-lg"
                >
                  {items.map((item) => (
                    <a
                      key={item.key}
                      href={item.path}
                      className={`block rounded px-3 py-2 text-sm ${
                        item.key === active ? "text-foreground" : "text-muted"
                      }`}
                    >
                      {item.label}
                    </a>
                  ))}
                </nav>
              </details>

              <form action={signOut}>
                <button
                  type="submit"
                  className="rounded-card px-3 py-2 text-sm text-muted transition-colors hover:text-foreground"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </Container>
      </header>

      <main
        id="main-content"
        className={`portal ${isFramed ? "py-6 sm:py-8" : "py-10 sm:py-14"}`}
      >
        <Container>
          {isFramed ? <div className="portal-card">{children}</div> : children}
        </Container>
      </main>
    </div>
  );
}
