"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { conference, links, navItems } from "@/content/site";
import { CTA, Container } from "@/components/ui";

/** Fraction of the hero scrolled past by the time the header is solid. */
const CHROME_FADE_AT = 0.12;

/**
 * Sticky header. Fully invisible at the top of the page — links, button, and
 * backdrop alike — and fades in as one piece once the page scrolls, reaching
 * solid at 12% of the hero. While invisible it also ignores the pointer, so
 * there are no working links the eye can't see. Highlights whichever section
 * is in view, and collapses to a disclosure menu on small screens.
 */
export default function Nav() {
  const [active, setActive] = useState<string>(navItems[0].id);
  const [menuOpen, setMenuOpen] = useState(false);
  const [chrome, setChrome] = useState(0);

  useEffect(() => {
    const sections = navItems
      .map(({ id }) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    // The top band of the viewport, just under the header, decides which link
    // is active: a section counts as current once its heading reaches it.
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-88px 0px -70% 0px", threshold: 0 },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const hero = document.getElementById("top");
    let frame = 0;

    const measure = () => {
      frame = 0;
      const heroHeight = hero?.offsetHeight ?? window.innerHeight;
      const distance = Math.max(heroHeight * CHROME_FADE_AT, 1);
      setChrome(Math.min(window.scrollY / distance, 1));
    };

    // Coalesce scroll events into one measurement per frame.
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // The open mobile menu must stay readable even at the top of the page.
  const barOpacity = menuOpen ? 1 : chrome;

  return (
    <header
      style={{
        opacity: barOpacity,
        pointerEvents: barOpacity < 0.05 ? "none" : undefined,
      }}
      className="sticky top-0 z-50"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 border-b border-rule bg-sand/80 backdrop-blur-md"
      />

      <Container className="relative">
        <div className="flex h-16 items-center gap-6">
          <a
            href="#top"
            aria-label={`${conference.shortName} — back to top`}
            className="shrink-0"
          >
            <Image
              src="/dcmc-logo.png"
              alt=""
              width={512}
              height={512}
              priority
              className="h-9 w-9"
            />
          </a>

          <nav
            aria-label="Sections"
            className="hidden items-center gap-4 md:flex lg:gap-8"
          >
            {navItems.map(({ id, label }) => (
              <a
                key={id}
                href={`#${id}`}
                aria-current={active === id ? "true" : undefined}
                className={`relative py-1 font-display text-sm uppercase tracking-[0.14em] transition-colors hover:text-foreground ${
                  active === id ? "text-foreground" : "text-muted"
                }`}
              >
                {label}
                {active === id ? (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-0.5 h-px bg-gold"
                  />
                ) : null}
              </a>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <CTA
              href={links.futureInterest}
              variant="secondary"
              className="hidden px-5 py-2.5 sm:inline-flex"
            >
              Express interest
            </CTA>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              className="-mr-2 p-2 text-foreground md:hidden"
            >
              <span className="sr-only">{menuOpen ? "Close menu" : "Open menu"}</span>
              <MenuIcon open={menuOpen} />
            </button>
          </div>
        </div>
      </Container>

      {menuOpen ? (
        <nav
          id="mobile-menu"
          aria-label="Sections"
          className="relative border-t border-rule bg-sand md:hidden"
        >
          <Container>
            <ul className="flex flex-col py-2">
              {navItems.map(({ id, label }) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    onClick={() => setMenuOpen(false)}
                    className={`block py-3 font-display text-base uppercase tracking-[0.14em] ${
                      active === id ? "text-foreground" : "text-muted"
                    }`}
                  >
                    {label}
                  </a>
                </li>
              ))}
              <li className="py-3">
                <CTA href={links.futureInterest} className="w-full">
                  Express interest
                </CTA>
              </li>
            </ul>
          </Container>
        </nav>
      ) : null}
    </header>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      {open ? (
        <>
          <line x1="5" y1="5" x2="19" y2="19" />
          <line x1="19" y1="5" x2="5" y2="19" />
        </>
      ) : (
        <>
          <line x1="3" y1="8" x2="21" y2="8" />
          <line x1="3" y1="16" x2="21" y2="16" />
        </>
      )}
    </svg>
  );
}
