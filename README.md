# DC Mini-Conference 2.0

Single-page site for DCMC 2.0 — October 23–25, 2026, Washington, DC.

## Develop

```bash
npm install
npm run dev          # http://localhost:3000
```

## Build

```bash
npm run build
npm start            # serve the production build locally
```

## Deploy (Vercel)

The project runs on Next's defaults, so Vercel needs no configuration:

1. Push to GitHub (already at `harshul-basava/dcmc`).
2. On vercel.com, **Add New → Project** and import the repo.
3. Accept the detected settings — framework Next.js, build `next build`,
   install `npm install` — and deploy.

There are no environment variables to set. Every push to `main` redeploys; other
branches get preview URLs.

To host on a plain static file server instead (GitHub Pages, S3), add
`output: "export"` and `images: { unoptimized: true }` to `next.config.ts` and
`npm run build` will emit `out/`. That trades away image optimization.

## Editing the site

**All copy, links, and dates live in [`src/content/site.ts`](src/content/site.ts).**
Change that one file to update the site; components read from it. Sections whose
data is still empty (photos, testimonials) render an explicit "coming soon"
state rather than disappearing.

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
    sections/     Hero, About, Timeline, Past, Contact
  server/         dashboard: session, auth, data seam, schedule, pairings
  proxy.ts        optimistic /dashboard gate (Next 16's renamed middleware)
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

## The private dashboard

`/dashboard` is a password-gated area for participants, guests, and organisers.
It is modelled on the AI risk workshop dashboard's information architecture,
rebuilt in this site's stack and brand.

`.env.example` carries working development defaults, so a fresh clone runs
without setup — copy it to `.env.local`. Both values are committed deliberately
and are safe only against fixture data; **replace both in production**, since a
published session secret lets anyone forge a signed admin cookie.

```text
DASHBOARD_SESSION_SECRET   signs the session cookie; 32+ characters
DASHBOARD_ADMIN_PASSWORD   the admin portal password (dev default: dcmc-admin)
```

**Signing in.** Participants and guests each have a two-word phrase
(`soft-fog`) shown on `/dashboard/admin/people`; case, spaces, and hyphens are
ignored, so `Soft Fog` works too. Organisers use `DASHBOARD_ADMIN_PASSWORD`.
A phrase that matches in both rosters is rejected rather than resolved, so two
people can never share one. Sessions are a signed, HttpOnly cookie holding only
a record id and a role, and last 12 hours.

**Pages.** Participants get Schedule, Directory, Guest directory, Feedback,
Reading list, and Handbook. Guests get a programme view, an availability
editor, and a bio editor. Organisers get an overview, People, Schedule,
Pairings, Feedback, and Portal pages.

**Portal pages** (`/dashboard/admin/pages`) control which pages each audience
can use. A closed page leaves the navigation *and* redirects direct requests —
it is a gate, not a hidden link.

**Pairings** are drafted and released separately. Generating writes a private
draft; participants see a block only once it is released, and `Hide` withdraws
it again without discarding the draft.

### Data

Everything is fixtures today. `src/server/data/index.ts` is the only module
that touches data — swap its function bodies for Airtable calls and no page
changes. Writes mutate in-memory arrays, so they last until the server restarts.

### A note on how it is built

The dashboard works with JavaScript disabled, and that is deliberate rather
than incidental: session dialogs and profile sheets are `:target` anchors and
CSS, the mobile menu is a `<details>` disclosure, and every form is a server
action. Please keep it that way — reach for a client component only when
something genuinely cannot be done otherwise.
