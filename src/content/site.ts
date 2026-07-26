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
  /** Header mark. The image already reads "DCMC"; the nav sets "2.0" beside it. */
  logo: "/temp_logo.png",
  version: "2.0",
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
  heading: "Why this conference",
  /** Two paragraphs so the dark band can set them side by side without a
      column break landing mid-sentence. Text is verbatim from the brief. */
  body: [
    "Mandating responsible AI development, deployment, and usage is a difficult challenge we must navigate soon. A limiting bottleneck is that there is a disconnect between the technical expertise of AI researchers and the regulatory machinery of DC, resulting in a critical lack of awareness of issues that will be too late to fix when we need it most.",
    "By bringing together motivated college students and knowledgeable guest speakers who all share an interest in AI policy, we hope to catalyze our generation to write policy for a future with safe AI that is used to empower—not to exploit.",
  ],
} as const;

export const whoShouldApply = {
  heading: "Who should apply",
  intro:
    "We're looking for college students who want to spend their careers making AI go well, whatever their starting discipline.",
  columns: [
    {
      title: "Students with policy ambition",
      body: "Undergraduates and recent graduates who are seriously considering a career in AI governance, law, or public service — not just curious about it.",
    },
    {
      title: "Technical people willing to translate",
      body: "Researchers and engineers who can explain what today's systems actually do, and who want that understanding to reach the people writing the rules.",
    },
    {
      title: "Builders of the next network",
      body: "People who will leave with collaborators, mentors, and a clearer next step — and who will bring others in behind them.",
    },
  ],
} as const;

export type Person = {
  name: string;
  role: string;
  affiliation?: string;
  /** Path under /public, e.g. "/speakers/jane-doe.jpg". Omit for a monogram. */
  photo?: string;
  bio?: string;
};

/** Empty renders "Speakers coming soon". Add entries to render the grid. */
export const speakers: Person[] = [];

/** Empty renders "Organizers announced soon". Add entries to render the grid. */
export const organizers: Person[] = [];

export const program = {
  heading: "What the weekend looks like",
  body: "Attendees for DCMC 2.0 will be provided lodging starting Thursday evening, October 15th. Programming will run from Friday morning, October 16th to midday Sunday, October 18th, with attendees leaving on Sunday. Specific details about the conference program will be announced as they become available.",
  scheduleNote: "Full schedule coming soon",
} as const;

export type TimelineItem = {
  date: string;
  label: string;
  note?: string;
  /** Marks the entry as not-yet-scheduled; renders muted with a "TBA" chip. */
  tba?: boolean;
};

export const timeline = {
  heading: "Key dates",
  items: [
    { date: "TBA", label: "Applications open", tba: true },
    { date: "TBA", label: "Application deadline", tba: true },
    { date: "TBA", label: "Decisions released", tba: true },
    { date: "Oct 15, 2026", label: "Arrival", note: "Lodging provided from Thursday evening." },
    { date: "Oct 16–18, 2026", label: "DC Mini-Conference 2.0", note: "Washington, DC" },
  ] satisfies TimelineItem[],
} as const;

export const venue = {
  heading: "Where you'll be",
  body: "DCMC 2.0 will take place in Washington DC. Details about the conference venue and accommodations will be announced as they become available.",
} as const;

export type Testimonial = { quote: string; name: string; affiliation?: string };

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
  testimonials: [] as Testimonial[],
} as const;

export const contact = {
  heading: "Contact",
  policymakerPrompt:
    "Work in policy and interested in speaking or attending? We'd like to hear from you.",
} as const;

/** Nav order drives both the header links and the scroll-spy. */
export const navItems = [
  { id: "about", label: "About" },
  { id: "speakers", label: "Speakers" },
  { id: "program", label: "Program" },
  { id: "venue", label: "Venue" },
  { id: "past", label: "DCMC 1.0" },
  { id: "contact", label: "Contact" },
] as const;
