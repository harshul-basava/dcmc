# Before launch

Everything below lives in **`src/content/site.ts`**. No component edits needed.

## Blocking — the site can't launch without these

- [ ] `links.apply` — real application URL. Until it's set, the APPLY NOW buttons
      render greyed out and non-clickable (in the hero, header, and footer).
- [ ] `links.refer` — real referral URL. Same disabled treatment.
- [ ] Confirm `contact@dcminiconf.com` is live and monitored.

## Content to fill in as it firms up

- [ ] `timeline.items` — the first three entries are `TBA`. Replace `date` with a
      real date and drop `tba: true` once each is set.
- [ ] `speakers` — empty array renders "Speakers coming soon". Add
      `{ name, role, affiliation?, photo?, bio? }` entries to render the grid.
      People without `photo` get a monogram tile, so a partly-filled roster still
      looks intentional.
- [ ] `organizers` — same shape, renders "Organizers announced soon" while empty.
- [ ] `program.body` / `program.scheduleNote` — replace the coming-soon panel with
      the real schedule when it exists.
- [ ] `venue.body` — swap in the actual venue once booked. The placeholder image
      block in `src/components/sections/Venue.tsx` should get a real photo then.
- [ ] `past.photos` — DCMC 1.0 photos. Put files in `public/dcmc1/` and add
      `{ src: "/dcmc1/foo.jpg", caption: "..." }`. Three placeholder frames show
      until then.
- [ ] `past.partners` — affiliated orgs. `{ name, logo? }`; logos go in
      `public/partners/`. Five placeholder tiles show until then.
- [ ] `past.testimonials` — quotes from DCMC 1.0 attendees. Two placeholder cards
      show until then.
- [ ] `links.policymakerInterest` — if you make an interest form for policymakers,
      set it here; the Contact section currently falls back to a mailto link.

## Copy I wrote (not from the source doc — review before launch)

These sections had no source text, so the wording is a first draft:

- `whoShouldApply` — the heading, intro, and all three columns.
- `past.intro` — the DCMC 1.0 lead-in.
- `contact.policymakerPrompt` — the policymaker interest line.
- The speaker and organizer intro sentences in
  `src/components/sections/People.tsx`.

## Assets

- [ ] Replace `src/app/favicon.ico` (still the Next.js default).
- [ ] Add an Open Graph image — see `metadata.openGraph` in `src/app/layout.tsx`.
