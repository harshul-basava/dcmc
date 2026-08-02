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

export const links: Record<"apply" | "refer" | "policymakerInterest", string> = {
  apply: "https://tinyurl.com/dcmcapp",
  refer: "https://tinyurl.com/dcmcrefer",
  /** For policymakers / speakers who want to signal interest. */
  policymakerInterest: PLACEHOLDER_LINK,
};

export const hero = {
  /**
   * One line per flag stripe on the landing, top to bottom. An empty string
   * leaves that stripe blank; `align` defaults to left.
   */
  lines: [
    { text: "AI Policy", descends: true },
    { text: "DC" },
    { text: "Mini" },
    { text: "Conference" },
    { text: "", cta: true },
    { text: conference.dates.replace(/,\s*\d{4}$/, ""), align: "right" },
    { text: conference.location, align: "right", descends: true },
  ] as {
    text: string;
    align?: "right";
    cta?: boolean;
    /** Line has a descender: ease the drop so it clears the stripe edge. */
    descends?: boolean;
  }[],
  badge: "2.0",
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
      "an undergraduate or recent graduate who is considering a career in AI governance, law, or public service",
      "a young professional with valuable skills looking to pivot to an impactful AI policy career",
      "a researcher or engineer who can explain what today's systems actually do, and who wants to translate that understanding to lawmakers",
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
    { date: "Sep 20, 2026", label: "Decisions released" },
    { date: "Oct 15, 2026", label: "Arrival", note: "Lodging provided from Thursday evening." },
    { date: "Oct 16–18, 2026", label: "DC Mini-Conference 2.0", note: "Washington, DC" },
  /* Annotated rather than inferred: with every date now confirmed, inference
     would drop the optional `tba` flag from the type entirely. */
  ] as TimelineItem[],
} as const;

/** Attribution is optional — DCMC 1.0 testimonials were collected anonymously.
    `highlight` is a phrase within the quote to render bold. */
export type Testimonial = {
  quote: string;
  highlight?: string;
  name?: string;
  affiliation?: string;
};

export const past = {
  heading: "DCMC 1.0",
  /** Paths under /public. The first photo takes the large mosaic slot;
      `position` is a CSS object-position for slots that crop the image. */
  photos: [
    {
      src: "/dcmc1/main.jpg",
      caption: "A guest speaker presenting on AI risk and policy at DCMC 1.0",
    },
    {
      src: "/dcmc1/side.jpg",
      caption: "A small-group session with a guest speaker at DCMC 1.0",
      /* The mosaic cell crops this 4:3 shot; bias right to keep the speaker. */
      position: "82% 50%",
    },
    {
      src: "/dcmc1/rooftop.jpg",
      caption: "Attendees at lunch on a DC rooftop during DCMC 1.0",
    },
  ] as { src: string; caption: string; position?: string }[],
  /** Orgs whose people joined DCMC 1.0 — rendered as a logo row. */
  partners: [
    { name: "Institute for Progress", logo: "/partners/ifp.svg" },
    { name: "Center for a New American Security", logo: "/partners/cnas.png" },
    { name: "Americans for Responsible Innovation", logo: "/partners/ari.svg" },
    { name: "Center for Security and Emerging Technology", logo: "/partners/cset.svg" },
    { name: "Foundation for American Innovation", logo: "/partners/fai.svg" },
    { name: "RAND Corporation", logo: "/partners/rand.png" },
  ] as { name: string; logo: string }[],
  testimonials: [
    {
      quote:
        "I can't seem to stress how powerful, inspiring and well-designed this was to move people like me to act more within this field.",
      highlight: "act more within this field",
    },
    {
      quote:
        "I think it will prove to be a big inflection point for my future in AI policy. I gained so, so much context and knowledge in the field that I am not sure I could, or would, have found otherwise.",
      highlight: "inflection point for my future in AI policy",
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
