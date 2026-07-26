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
    sections/     Hero, About, People, Program, Venue, Past, Contact
```

Nav links are anchors into `page.tsx` sections. To add a section, create the
component, add it to `page.tsx`, and add its `id` to `navItems` in `site.ts` —
the header and scroll-spy pick it up automatically.

## Design

Ivory `#FAFAF8` / near-black `#14161A` / navy `#1E3A5F` accent, Inter throughout,
sections separated by whitespace and hairline rules. Colors are CSS variables in
`globals.css` with a dark-mode block. Respects `prefers-reduced-motion`.
