/**
 * Copy for the private dashboard, kept out of components for the same reason
 * `site.ts` exists: the conference team should be able to edit words without
 * touching JSX. Placeholder entries are marked; replace before launch.
 */

export type Reading = {
  title: string;
  author: string;
  url: string;
  /** One line on why it is on the list. */
  takeaway: string;
  /** Extra instruction — how much to read, how to approach it. */
  note?: string;
};

export const coreReadings: Reading[] = [
  {
    title: "The Problem",
    author: "Machine Intelligence Research Institute",
    url: "https://intelligence.org/the-problem/",
    takeaway:
      "The case that smarter-than-human AI is dangerous by default, stated in full.",
  },
  {
    title: "AI 2040: Plan A",
    author: "AI Futures Project",
    url: "https://ai-2040.com/",
    takeaway:
      "A scenario for how the world could navigate superhuman AI — a recommendation, not a forecast.",
    note: "Read the main scenario. The supplements are optional but recommended, especially the Verification, Transparency and Space Governance plans.",
  },
  {
    title: "The Current Bottleneck Is Political Will, Not Research",
    author: "Charbel-Raphaël",
    url: "https://www.alignmentforum.org/posts/EexsebbYhbe2gXkPP/the-current-bottleneck-is-political-will-not-research",
    takeaway:
      "Why the binding constraint on AI safety is the people who decide, not the people who research.",
  },
];

export type ReadingSection = {
  heading: string;
  /** Standing advice that applies to the whole section. */
  note?: string;
  items: Reading[];
};

export const furtherReadings: ReadingSection[] = [
  {
    heading: "Landmark AI legislation",
    items: [
      {
        title: "America's AI Action Plan",
        author: "The White House",
        url: "https://www.whitehouse.gov/wp-content/uploads/2025/07/Americas-AI-Action-Plan.pdf",
        takeaway: "The federal government's stated AI strategy, in its own words.",
      },
      {
        title: "Illinois SB 315 — AI Safety Measures Act",
        author: "Illinois General Assembly",
        url: "https://ilga.gov/Legislation/BillStatus/FullText?LegDocId=197587&DocName=10400SB0315&DocNum=315&DocTypeID=SB&LegID=157797&GAID=18&SessionID=114",
        takeaway: "The first state framework for catastrophic risk from frontier models.",
        note: "Pages 1–23. Stop midway down page 23, at \u201CSection 80. The Freedom of Information Act is amended\u2026\u201D. This is a primary-source legal document, so you are welcome to use an LLM to help parse the jargon.",
      },
      {
        title: "California SB 53 — Transparency in Frontier AI Act",
        author: "California Legislature",
        url: "https://leginfo.legislature.ca.gov/faces/billTextClient.xhtml?bill_id=202520260SB53",
        takeaway: "The first US law aimed squarely at catastrophic risk.",
      },
      {
        title: "New York RAISE Act (S6953-B)",
        author: "New York State Senate",
        url: "https://www.nysenate.gov/legislation/bills/2025/S6953/amendment/B",
        takeaway: "Safety plans, incident reporting, and a dedicated enforcement office.",
      },
      {
        title: "State AI Safety Laws: Illinois, California and New York",
        author: "KPMG",
        url: "https://kpmg.com/us/en/articles/2026/state-ai-safety-laws-il-ca-and-ny-reg-alert.html",
        takeaway: "How the three state regimes compare, if you want the short version first.",
      },
    ],
  },
  {
    heading: "Working in AI governance",
    items: [
      {
        title: "What It's Like to Work at the White House",
        author: "Dean W. Ball",
        url: "https://www.hyperdimensional.co/p/what-its-like-to-work-at-the-white",
        takeaway: "A first-hand account of AI policy work from inside the building.",
      },
      {
        title: "Advice for undergraduates",
        author: "Emerging Technology Policy Careers",
        url: "https://emergingtechpolicy.org/pathways/undergraduate-advice/",
        takeaway: "What to study, what grades matter, and when to go to graduate school.",
      },
      {
        title: "How to shape policy from outside government",
        author: "Horizon Launchpad",
        url: "https://horizonlaunchpad.substack.com/p/how-to-shape-policy-from-outside",
        takeaway: "Influence without a government badge, and how to tell if it is working.",
      },
    ],
  },
  {
    heading: "Understanding intelligence explosions",
    items: [
      {
        title: "Three Types of Intelligence Explosion",
        author: "Forethought",
        url: "https://www.forethought.org/research/three-types-of-intelligence-explosion",
        takeaway: "The distinct mechanisms by which AI progress could become self-accelerating.",
      },
      {
        title: "AI 2027",
        author: "Kokotajlo, Alexander, Larsen, Lifland and Dean",
        url: "https://ai-2027.com/",
        takeaway: "A concrete scenario for how the next couple of years could play out.",
      },
      {
        title: "On Recursive Self-Improvement (Part I)",
        author: "Dean W. Ball",
        url: "https://www.hyperdimensional.co/p/on-recursive-self-improvement-part",
        takeaway: "Frontier labs are automating their own research, largely unnoticed.",
      },
      {
        title: "On Recursive Self-Improvement (Part II)",
        author: "Dean W. Ball",
        url: "https://www.hyperdimensional.co/p/on-recursive-self-improvement-part-d9b",
        takeaway: "What rules exist for a lab that automates its own research. Roughly none.",
      },
      {
        title: "Selective Optimism: a critique of AI 2040",
        author: "Richard Ngo",
        url: "https://www.lesswrong.com/posts/BBd2EJywf2xXftyFn/selective-optimism-a-critique-of-ai-2040",
        takeaway: "The strongest published objection to Plan A, written at its authors' invitation.",
      },
    ],
  },
  {
    heading: "Coordination and pacing",
    items: [
      {
        title: "China Is Not Opposed to Global AI Coordination",
        author: "Jasmine Li",
        url: "https://jasminexli.substack.com/p/china-is-not-opposed-to-global-ai",
        takeaway: "Against the assumption that Beijing would refuse any deal.",
      },
      {
        title: "How to Pace the US Frontier",
        author: "AI Futures Project",
        url: "https://blog.aifutures.org/p/how-to-pace-the-us-frontier",
        takeaway: "What slowing down would actually require, mechanically.",
      },
      {
        title: "The Flood",
        author: "Anton Leicht",
        url: "https://writing.antonleicht.me/p/the-flood",
        takeaway: "How AI safety money could reshape American AI politics.",
      },
    ],
  },
  {
    heading: "Keeping up with the news",
    note: "You should generally be following Transformer to keep up with AI policy news. These are worth reading in particular.",
    items: [
      {
        title: "Everything you need to know about the 'rogue' AI incidents",
        author: "Transformer",
        url: "https://www.transformernews.ai/p/rogue-ai-incidents-timeline",
        takeaway: "A timeline of the models that escaped their test environments.",
      },
      {
        title: "The report into OpenAI's escaping models reveals a deeper problem",
        author: "Transformer",
        url: "https://www.transformernews.ai/p/openai-escaping-models-report-reveals-deeper-problem",
        takeaway: "What the incident report says about alignment and control.",
      },
      {
        title: "Congress must not waste the AI policy window",
        author: "Transformer",
        url: "https://www.transformernews.ai/p/congress-must-not-waste-the-ai-policy-window",
        takeaway:
          "Why a weak federal standard that preempts the state laws would squander the moment.",
      },
    ],
  },
];

export type ResourceGroup = { id: string; heading: string; items: Reading[] };

/**
 * Cleared for now. Add groups back here and the resources page — jump nav and
 * all — fills itself in; it renders an honest empty state while this is empty.
 */
export const resourceGroups: ResourceGroup[] = [];

export const handbookLinks = [
  {
    title: "Conference resources",
    body: "Slide decks, reading lists, and the career resources we mention during the weekend.",
    href: "/dashboard/handbook/resources",
  },
  {
    title: "Code of conduct",
    body: "What we expect of everyone here, and who to contact if something goes wrong.",
    href: "/dashboard/handbook/code-of-conduct",
  },
  {
    title: "Logistics",
    body: "Dates, the office, the hotel, and how to claim your travel back.",
    // Short enough to read in place: this opens a dialog rather than a page.
    href: "#logistics",
  },
];

/** The Logistics dialog, opened from the handbook card of the same name. */
export const logistics = {
  lead:
    "The DC Mini-Conference on AI Governance will take place from 7 PM Thursday, October 22nd " +
    "to 6 PM Sunday October 25th. Arrival and check-in is from 4–6 PM on Thursday, October 22nd.",
  sections: [
    {
      title: "Reimbursements",
      // "here" becomes a link once there is a form to point it at.
      body: "Attendees will be reimbursed up to $400 for flight costs. Submit receipts here.",
    },
    {
      title: "Office",
      body:
        "The mini-conference will be held at the Network on Emerging Threats office near the " +
        "McPherson Square metro stop.",
    },
    {
      title: "Hotel",
      body:
        "Attendees will be staying at the District Hotel, DC at 1440 Rhode Island Ave NW, " +
        "Washington, DC 20005. Make sure to check in before 7 PM on Thursday, October 22nd, " +
        "or let us know if circumstances prevent you from doing so.",
    },
  ],
} as const;

/**
 * The organizing team, as shown on the handbook's Getting help section.
 *
 * `contact` is whatever an attendee should use to reach that person — a
 * number beginning "+" is rendered as a dialable link. Blank is a real
 * state: the person is listed, their line is waiting to be filled in.
 *
 * `photo` is a path under /public once real headshots exist; until then
 * every slot falls back to a gradient plate.
 */
export const organizers: { name: string; contact: string; photo?: string }[] = [
  { name: "Harshul Basava", contact: "+1 (408) 355-4218" },
  { name: "Liam Robins", contact: "" },
  { name: "Seth Lifland", contact: "" },
  { name: "Binit Maharjan", contact: "" },
  { name: "Isel Neira", contact: "" },
  { name: "Aybars Kocoglu", contact: "" },
  { name: "Rohan Kansal", contact: "" },
];

/**
 * The team in a different order each time.
 *
 * Deliberately impure, and deliberately not inline in the page: a random
 * order is the point — nobody should be permanently first — but a component
 * body is meant to be replayable, so the randomness lives here rather than
 * in the render. The dashboard layout is force-dynamic, so this re-runs on
 * every request.
 */
export function shuffledOrganizers(): typeof organizers {
  const team = [...organizers];
  for (let i = team.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [team[i], team[j]] = [team[j], team[i]];
  }
  return team;
}
