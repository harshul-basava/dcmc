# DC Mini-Conference 2.0

Single-page site for DCMC 2.0 — October 16–18, 2026, Washington, DC.

## Develop

```bash
npm install
npm run dev          # http://localhost:3000
```

## Build

```bash
npm run build        # static HTML/CSS/JS into out/
```

`next.config.ts` sets `output: "export"`, so `out/` can be dropped on Netlify,
Vercel, GitHub Pages, or any static host.

## Editing the site

**All copy, links, dates, and people live in [`src/content/site.ts`](src/content/site.ts).**
Change that one file to update the site; components read from it. Sections whose
data is still empty (speakers, organizers, photos, testimonials) render an
explicit "coming soon" state rather than disappearing.

See [TODO.md](TODO.md) for what still needs real values before launch.

## Structure

```
src/
  app/            layout (fonts, metadata), page (section order), globals.css (theme)
  content/site.ts single source of truth for content
  components/
    Nav.tsx       sticky header, anchor links, scroll-spy, mobile menu
    Footer.tsx
    ui.tsx        Container / Section / headings / CTA / ComingSoon
    PersonGrid.tsx
    sections/     Hero, About, People, Program, Past, Contact
```

Nav links are anchors into `page.tsx` sections. To add a section, create the
component, add it to `page.tsx`, and add its `id` to `navItems` in `site.ts` —
the header and scroll-spy pick it up automatically.

## Hero

The landing hero follows the Generator Residency layout: `public/capitol.png`
fills the left side and dissolves into the page colour, with the title block set
right against it. The dissolve is a CSS mask on `.hero-photo` in `globals.css` —
rightward above 768px, downward below it, where the photo moves above the text.
`.hero-veil` softens the top and bottom edges; `.hero-grid` lays the faint
surveyor's grid over the photo.

## Design

Warm sand `#F5F0E6` base, near-black `#1A1818` text, deep navy ink `#14212E` for
the dark bands, navy `#1E3A5F` for buttons, and gold `#C08A2E` used only for
small markers (eyebrow rules, timeline dots, numerals).

Two faces: **Newsreader** (`font-display`) for the wordmark, nav, headings, and
buttons, and **Inter** for body copy.

Sections are **full-bleed tone bands** rather than rule-separated blocks. Each
`<Section>` takes `tone="sand" | "surface" | "ink"`; the tone sets the background
and, for `ink`, flips `--foreground` / `--muted` / `--rule` / `--card` so the same
components work on a dark band with no tone-aware props. The running order is
sand → ink → surface → sand → surface → sand → surface → ink.

All colors are CSS variables in `globals.css`. **The site is light-only**: it
declares `color-scheme: light` and has no `prefers-color-scheme: dark` block, so
it renders identically whatever the viewer's OS is set to. That is deliberate —
the cream palette has no honest dark translation, and because the hero photo is
masked rather than cropped, a dark page background bleeds through it as black.
Both reference sites are light-only for the same reason.

The dark bands in the middle of the page come from `tone="ink"`, which is a
design choice, not a theme.

Respects `prefers-reduced-motion`; anchor clicks jump instantly (no smooth
scroll).
