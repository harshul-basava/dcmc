/**
 * Single source of truth for every piece of copy, link, date, and person on the
 * site. Edit this file to update the site — no component changes needed.
 *
 * Anything set to PLACEHOLDER_LINK or left as an empty array renders as an
 * honest "coming soon" state. See TODO.md for what still needs real values.
 */

/** Sentinel for a link we don't have yet. Buttons using it render as disabled. */
export const PLACEHOLDER_LINK = "#";

export const conference = {
  name: "DC Mini-Conference 2.0",
  shortName: "DCMC 2.0",
  dates: "October 16–18, 2026",
  location: "Washington, DC",
  email: "contact@dcminiconf.com",
} as const;

export const links = {
  apply: PLACEHOLDER_LINK,
  refer: PLACEHOLDER_LINK,
  /** For policymakers / speakers who want to signal interest. */
  policymakerInterest: PLACEHOLDER_LINK,
} as const;

export const hero = {
  headline: "A three-day workshop on making AI policy go well.",
} as const;

export const about = {
  heading: "There aren’t enough people working on policy to make sure AI goes well.",
  body: [
    "Policy mandating responsible AI development, deployment, and usage will decide the future. A major bottleneck on impactful, informed policy work is the disconnect between the technical expertise of AI researchers and Washington’s policy landscape, leaving pressing issues that require early attention unaddressed.",
    "By bringing together motivated students, young professionals, and knowledgeable guest speakers who all share an interest in AI policy, we hope to develop the next generation of policymakers working towards safe AI for now and the future.",
  ],
  /** The who-this-is-for callout beside the mission paragraph. */
  callout: {
    lead: "If you are:",
    bullets: [
      "an undergraduate or recent graduate who is considering a career in AI governance, law, or public service,",
      "a young professional with valuable skills looking to pivot to policy concerning the near future,",
      "a researcher or engineer who can explain what today's systems actually do, and who wants to translate that understanding to lawmakers,",
    ],
    /** Rendered as: prefix, then the application link, then the period. */
    closingPrefix: "then this conference is for you: ",
    closingLink: "apply here",
  },
} as const;

export type TimelineItem = {
  date: string;
  label: string;
  note?: string;
  /** Marks the entry as not-yet-scheduled; renders muted with a "TBA" chip. */
  tba?: boolean;
};

export const timeline = {
  heading: "Timeline",
  items: [
    { date: "Aug 3, 2026", label: "Applications open" },
    { date: "Sep 12, 2026", label: "Application deadline" },
    { date: "TBA", label: "Decisions released", tba: true },
    { date: "Oct 15, 2026", label: "Arrival", note: "Lodging provided from Thursday evening." },
    { date: "Oct 16–18, 2026", label: "DC Mini-Conference 2.0", note: "Washington, DC" },
  ] satisfies TimelineItem[],
} as const;

/** Attribution is optional — DCMC 1.0 testimonials were collected anonymously. */
export type Testimonial = { quote: string; name?: string; affiliation?: string };

export const past = {
  heading: "DCMC 1.0",
  intro:
    "The first DC Mini-Conference brought students and policy practitioners into the same room for a weekend. Here's what came out of it.",
  /** Paths under /public, e.g. "/dcmc1/opening-session.jpg". Empty renders placeholder frames. */
  photos: [] as { src: string; caption: string }[],
  /** Number of placeholder frames to show while `photos` is empty. */
  photoPlaceholderCount: 3,
  /** Org names (and optional logo paths under /public) we've worked with. */
  partners: [] as { name: string; logo?: string }[],
  partnerPlaceholderCount: 5,
  testimonials: [
    {
      quote:
        "I can't seem to stress how powerful, inspiring and well-designed this was to move people like me to act more within this field.",
    },
    {
      quote:
        "I think it will prove to be a big inflection point for my future in AI safety. I gained so, so much context and knowledge in the field that I am not sure I could, or would, have found otherwise.",
    },
  ] as Testimonial[],
} as const;

export const contact = {
  policymakerPrompt:
    "Work in policy and interested in speaking or attending? We'd like to hear from you.",
} as const;

/** Nav order drives both the header links and the scroll-spy. */
export const navItems = [
  { id: "about", label: "About" },
  { id: "timeline", label: "Timeline" },
  { id: "past", label: "DCMC 1.0" },
  { id: "contact", label: "Contact" },
] as const;
