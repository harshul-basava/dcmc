# Before launch

Everything below lives in **`src/content/site.ts`**. No component edits needed.

## Blocking — the site can't launch without these

- [ ] Confirm `contact@dcminiconf.com` is live and monitored.

## Content to fill in as it firms up

- [ ] `timeline.items` — "Decisions released" is still `TBA`. Replace `date` with
      a real date and drop `tba: true` once it is set.
- [ ] Speakers & organizers — both sections were removed on 2026-07-29 while
      empty (recoverable from git history) and will need rebuilding once there
      are real people to show.
- [ ] Schedule — the Timeline section shows dates only. Add the day-by-day
      programme here once it exists.
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

- [ ] Replace the favicon (`src/app/icon.png` / `apple-icon.png`) when the real
      logo lands — they are generated from `public/temp_logo.png`.
- [ ] Add an Open Graph image — see `metadata.openGraph` in `src/app/layout.tsx`.
