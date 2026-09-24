/**
 * Stand-in data for the dashboard until the real roster exists.
 *
 * Everything here is invented. The shapes are real, so pages written against
 * this file keep working when `src/server/data/index.ts` starts reading
 * Airtable instead. Ids follow Airtable's `rec` + 14-character format because
 * `src/server/session.ts` validates against it.
 */

import type {
  Assignment,
  ConversationPreference,
  FeedbackResponse,
  Guest,
  Participant,
  PortalPageSetting,
  Session,
  SessionType,
} from "./types";

/** Pads a short slug into a well-formed 17-character Airtable record id. */
function rec(prefix: string, n: number): string {
  const tail = `${prefix}${String(n).padStart(2, "0")}`.toUpperCase();
  return `rec${tail.padEnd(14, "X").slice(0, 14)}`;
}

export const participantId = (n: number) => rec("P", n);
export const guestId = (n: number) => rec("G", n);

/** name | title | school | organization | interests | password */
const PARTICIPANT_SEED: [string, string, string, string, string, string][] = [
  ["Amara Okonjo", "Undergraduate, Public Policy", "Georgetown University", "", "Policy,Communications", "soft-fog"],
  ["Daniel Reyes", "JD Candidate", "Yale Law School", "", "Legal,Policy", "warm-tide"],
  ["Priya Raghunathan", "MPP Candidate", "Harvard Kennedy School", "", "Policy,Technical", "quiet-moss"],
  ["Ethan Brooks", "Undergraduate, Computer Science", "Carnegie Mellon University", "", "Technical", "brisk-dune"],
  ["Sofia Marchetti", "Recent graduate", "Columbia University", "Senate staff", "Politics,Policy", "pale-reef"],
  ["Marcus Bell", "Undergraduate, Economics", "University of Chicago", "", "Policy,Technical", "still-vale"],
  ["Hana Kobayashi", "PhD Candidate, ML", "Stanford University", "", "Technical", "deep-lark"],
  ["Olu Adeyemi", "JD Candidate", "Howard University", "", "Legal", "fair-glen"],
  ["Rachel Stern", "MPA Candidate", "Princeton SPIA", "", "Policy,Operations", "lone-crag"],
  ["Tomas Vieira", "Undergraduate, Physics", "MIT", "", "Technical,Policy", "swift-elm"],
  ["Nadia Haddad", "Recent graduate", "American University", "House staff", "Politics", "grey-fern"],
  ["Julian Ortega", "Undergraduate, Philosophy", "University of Texas", "", "Policy", "calm-bay"],
  ["Ingrid Larsen", "MS Candidate, Security Studies", "Georgetown University", "", "Policy,Technical", "clear-oak"],
  ["Devon Wright", "Undergraduate, Political Science", "Morehouse College", "", "Politics,Communications", "brave-isle"],
  ["Mei-Lin Chao", "JD/MPP Candidate", "UC Berkeley", "", "Legal,Policy", "plain-silt"],
  ["Aaron Feldman", "Recent graduate", "Northwestern University", "Think tank RA", "Policy,Operations", "young-birch"],
  ["Zara Qureshi", "Undergraduate, Statistics", "Duke University", "", "Technical", "sharp-vine"],
  ["Gabriel Santos", "MPP Candidate", "University of Michigan", "", "Policy", "lucid-shore"],
  ["Elena Petrova", "PhD Candidate, Political Econ", "NYU", "", "Policy,Technical", "amber-frost"],
  ["Malik Johnson", "Undergraduate, Public Health", "Emory University", "", "Policy,Communications", "solid-pike"],
  ["Claire Dubois", "JD Candidate", "University of Virginia", "", "Legal,Politics", "frank-mesa"],
  ["Rohan Mehta", "MS Candidate, CS", "University of Washington", "", "Technical,Operations", "noble-kiln"],
  ["Sarah Whitfield", "Recent graduate", "Vanderbilt University", "Federal agency", "Operations,Policy", "gentle-ridge"],
  ["Kwame Asante", "Undergraduate, International Relations", "Tufts University", "", "Politics,Policy", "vivid-larch"],
];

export const participants: Participant[] = PARTICIPANT_SEED.map(
  ([name, title, school, organization, interests, shortPassword], i) => ({
    id: participantId(i + 1),
    name,
    title,
    school,
    organization: organization || school,
    interests: interests.split(","),
    bio: `${name.split(" ")[0]} is ${/^[aeiou]/i.test(title) ? "an" : "a"} ${title.toLowerCase()} at ${school}, focused on ${interests
      .split(",")
      .join(" and ")
      .toLowerCase()} questions in AI governance. Placeholder biography — replace with the real one before launch.`,
    email: `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@example.edu`,
    shortPassword,
    accessCount: [0, 3, 1, 0, 7, 2, 0, 4, 1, 0, 5, 2][i % 12],
    linkedin: i % 3 === 0 ? `https://www.linkedin.com/in/${name.toLowerCase().replace(/[^a-z]+/g, "-")}` : undefined,
  }),
);

/**
 * Deliberately empty. Guests come from the "DCMC 2.0 Speakers and Guests"
 * RSVP table in Airtable; there is no offline stand-in because the invented
 * ones that used to live here were indistinguishable from real speakers at
 * real organizations, and they surfaced on the live site.
 *
 * With no token configured the guest directory is simply empty.
 */
export const guests: Guest[] = [];

/** day | start | end | title | type | location | speaker | description */
type SessionSeed = [string, string, string, string, SessionType, string, string, string];

const SESSION_SEED: SessionSeed[] = [
  // Thursday — arrival evening.
  ["2026-10-22", "18:00", "20:00", "Arrival and check-in", "logistics", "Hotel lobby", "", "Pick up your badge and room key. Staff are on hand until 10pm."],
  ["2026-10-22", "20:00", "21:30", "Welcome reception", "social", "Rooftop terrace", "", "Informal drinks and introductions. No programming — come and go as you like."],

  // Friday.
  ["2026-10-23", "08:00", "09:00", "Breakfast", "meal", "Dining room", "", ""],
  ["2026-10-23", "09:00", "09:30", "Opening remarks", "talk", "Main hall", "DCMC organizers", "What the next three days look like, and how to get the most out of them."],
  ["2026-10-23", "09:30", "10:45", "The AI policy landscape in Washington", "talk", "Main hall", "Dr. Helen Vasquez", "A map of who actually writes AI policy in DC: the committees, the agencies, and the think tanks that feed them."],
  ["2026-10-23", "10:45", "11:00", "Break", "break", "Foyer", "", ""],
  ["2026-10-23", "11:00", "12:15", "From research to regulation", "panel", "Main hall", "James Okoro, Anita Desai, Greg Tanaka", "How technical findings become statutory language — and what gets lost on the way."],
  ["2026-10-23", "12:15", "13:30", "Lunch", "meal", "Dining room", "", ""],
  ["2026-10-23", "13:30", "15:00", "One-on-one conversations", "one-to-one", "Breakout rooms", "", "Two half-hour conversations with other attendees and guests. Your partners appear here once pairings are released."],
  ["2026-10-23", "15:00", "16:30", "Small group discussions", "small-group", "Breakout rooms", "", "Facilitated discussion in a small group. Your group and room appear here once assignments are released."],
  ["2026-10-23", "16:30", "17:30", "Careers in AI governance", "talk", "Main hall", "Michelle Andrada", "Paths into the field, what each one actually asks of you, and what the hiring market looks like right now."],
  ["2026-10-23", "18:30", "20:30", "Dinner", "meal", "Dining room", "", ""],

  // Saturday.
  ["2026-10-24", "08:00", "09:00", "Breakfast", "meal", "Dining room", "", ""],
  ["2026-10-24", "09:00", "10:30", "Writing a policy memo", "workshop", "Main hall", "Anita Desai", "Hands-on session. Bring a laptop — you will draft and workshop a one-pager."],
  ["2026-10-24", "10:30", "10:45", "Break", "break", "Foyer", "", ""],
  ["2026-10-24", "10:45", "12:00", "Compute governance", "talk", "Main hall", "Robert Kim", "Export controls, chip supply chains, and what governing compute can and cannot achieve."],
  ["2026-10-24", "12:00", "13:15", "Lunch", "meal", "Dining room", "", ""],
  ["2026-10-24", "13:15", "14:45", "One-on-one conversations", "one-to-one", "Breakout rooms", "", "Two half-hour conversations. Your partners appear here once pairings are released."],
  ["2026-10-24", "15:00", "16:30", "Small group discussions", "small-group", "Breakout rooms", "", "Facilitated discussion in a small group."],
  ["2026-10-24", "16:30", "17:45", "Working inside government", "panel", "Main hall", "Greg Tanaka, Fatima Nasser", "What the job is really like from inside an agency, and how to be useful in your first year."],
  ["2026-10-24", "19:00", "21:30", "Conference dinner", "meal", "Private dining room", "", "Seated dinner with guest speakers. Business casual."],

  // Sunday.
  ["2026-10-25", "08:30", "09:30", "Breakfast", "meal", "Dining room", "", ""],
  ["2026-10-25", "09:30", "11:00", "Policy proposal presentations", "workshop", "Main hall", "", "Attendees present the proposals they have been developing. Five minutes each, then questions."],
  ["2026-10-25", "11:00", "11:15", "Break", "break", "Foyer", "", ""],
  ["2026-10-25", "11:15", "12:30", "Where the field goes next", "talk", "Main hall", "Dr. Paul Whitmore", "Open questions nobody has good answers to yet, and where a newcomer can still make a difference."],
  ["2026-10-25", "12:30", "13:30", "Closing lunch", "meal", "Dining room", "", ""],
  ["2026-10-25", "13:30", "14:00", "Closing remarks", "talk", "Main hall", "DCMC organizers", "Where to go from here, and how to stay in touch."],
];

const PERSONALIZED_TYPES = new Set<SessionType>(["one-to-one", "small-group"]);

export const sessions: Session[] = SESSION_SEED.map(
  ([day, start, end, title, type, location, speaker, description], i) => ({
    id: rec("S", i + 1),
    title,
    day,
    start: `${day}T${start}`,
    end: `${day}T${end}`,
    type,
    track: type === "talk" || type === "panel" ? "Plenary" : type === "workshop" ? "Workshop" : "",
    status: "confirmed",
    location,
    speaker,
    slidoUrl: type === "talk" || type === "panel" ? "https://app.sli.do/event/dcmc2026" : undefined,
    description,
    personalized: PERSONALIZED_TYPES.has(type),
  }),
);

const oneToOneSessions = sessions.filter((s) => s.type === "one-to-one");
const smallGroupSessions = sessions.filter((s) => s.type === "small-group");

/**
 * Friday's blocks are published (so a signed-in participant sees real partners
 * and a real group); Saturday's are left as drafts, which is what renders the
 * "TBD" state on the schedule.
 */
function seedAssignments(): Assignment[] {
  const rows: Assignment[] = [];
  let n = 0;
  const add = (row: Omit<Assignment, "id">) => rows.push({ id: rec("A", ++n), ...row });

  oneToOneSessions.forEach((session, sessionIndex) => {
    const state = sessionIndex === 0 ? "published" : "draft";
    // Two independent halves, each pairing everyone with someone different.
    for (const [half, offset] of [
      ["S1", 1],
      ["S2", 5],
    ] as const) {
      for (let i = 0; i < 20; i += 2) {
        const a = participants[i];
        const b = participants[(i + offset) % 20];
        if (!a || !b || a.id === b.id) continue;
        const group = `${half} · 1:1 ${String(i / 2 + 1).padStart(2, "0")}`;
        add({ sessionId: session.id, personKey: `participant:${a.id}`, group, location: `Room ${i / 2 + 1}`, kind: "1:1", state });
        add({ sessionId: session.id, personKey: `participant:${b.id}`, group, location: `Room ${i / 2 + 1}`, kind: "1:1", state });
      }
    }
  });

  smallGroupSessions.forEach((session, sessionIndex) => {
    const state = sessionIndex === 0 ? "published" : "draft";
    const labels = ["Group A", "Group B", "Group C", "Group D", "Group E", "Group F"];
    participants.forEach((person, i) => {
      const g = i % labels.length;
      add({
        sessionId: session.id,
        personKey: `participant:${person.id}`,
        group: labels[g],
        location: `Breakout ${g + 1}`,
        kind: "Small group",
        state,
      });
    });
    // One guest facilitates each group; their name becomes the group's label
    // for participants, matching how the source dashboard renders SGDs.
    guests.slice(0, labels.length).forEach((guest, g) => {
      add({
        sessionId: session.id,
        personKey: `guest:${guest.id}`,
        group: labels[g],
        location: `Breakout ${g + 1}`,
        kind: "Small group",
        state,
      });
    });
  });

  return rows;
}

export const assignments: Assignment[] = seedAssignments();

export const preferences: ConversationPreference[] = participants
  .slice(0, 8)
  .flatMap((person, i) =>
    guests.slice(0, 3).map((guest, r) => ({
      id: rec("C", i * 3 + r + 1),
      sourceKey: `participant:${person.id}` as const,
      targetKey: `guest:${guest.id}` as const,
      rank: r + 1,
    })),
  );

export const portalPageSettings: PortalPageSetting[] = [];

export const feedbackResponses: FeedbackResponse[] = participants.slice(0, 6).map((person, i) => ({
  id: rec("F", i + 1),
  form: i < 4 ? "friday" : "overall",
  participantId: person.id,
  participantName: person.name,
  date: i < 4 ? "2026-10-23" : "2026-10-25",
  sessions: sessions
    .filter((s) => s.day === "2026-10-23" && (s.type === "talk" || s.type === "panel"))
    .map((s) => ({
      sessionId: s.id,
      title: s.title,
      rating: ((i + s.title.length) % 5) + 1,
      comment: i % 3 === 0 ? "Useful framing, would have liked more time for questions." : "",
    })),
  answers: {
    learned: "How much of the real decision-making happens at the staff level rather than the member level.",
    additional: i % 2 === 0 ? "The one-on-ones were the most valuable part of the day." : "",
  },
  ratings: { day: ((i * 2) % 5) + 1, satisfaction: 7 + (i % 4), recommend: 8 + (i % 3) },
  submittedAt: `2026-10-2${i < 4 ? 3 : 5}T21:0${i}:00`,
}));
