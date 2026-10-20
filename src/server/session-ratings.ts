import { getGuests, getSessions } from "./data";
import type { Session } from "./data/types";
import { oneToOneConversations, type Conversation } from "./feedback";
import { formatRange, minutesOf } from "./schedule";

export type SessionRatingOption = {
  id: string;
  title: string;
  speaker: string;
  timeLabel: string;
  sortKey: string;
  guests?: { id: string; name: string }[];
};

function weekday(day: string): string {
  return new Date(`${day}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
}

/** Only used in authenticated feedback. Never add this guest to public schedule data. */
const PRIVATE_QA_GUEST_ID = "rectt3RPdI5qNQ1ds";

export function buildSessionRatingOptions(
  sessions: Session[], conversations: Conversation[], privateGuestName: string,
): SessionRatingOption[] {
  const options: SessionRatingOption[] = [];
  const thursday = sessions.filter((session) => weekday(session.day) === "Thursday").sort((a, b) => a.start.localeCompare(b.start));
  if (thursday.length) options.push({
    id: "thursday-evening", title: "Thursday evening dinner and activities", speaker: "",
    timeLabel: "Thursday", sortKey: thursday[0].start,
  });

  for (const session of sessions) {
    if (weekday(session.day) === "Thursday") continue;
    if (["break", "logistics", "one-to-one", "meal"].includes(session.type)) continue;
    if (/breakfast|\blunch\b|\bdinner\b|reflection|transition|\bbreak\b|monument|happy\s+hour\s+prep|group\s+photo/i.test(session.title)) continue;
    const timeLabel = `${weekday(session.day)} · ${formatRange(minutesOf(session.start), minutesOf(session.end))}`;
    const rotating = /rotating\s+q\s*&\s*a/i.test(session.title) && !/introduction|norms/i.test(session.title);
    if (rotating) {
      const facilitators = session.speaker.split(/[,;\n]+/).map((name) => name.trim()).filter(Boolean);
      if (weekday(session.day) === "Saturday") facilitators.push(privateGuestName);
      const seen = new Set<string>();
      const guests: NonNullable<SessionRatingOption["guests"]> = [];
      for (const name of facilitators) {
        const key = name.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
        if (seen.has(key)) continue;
        seen.add(key);
        guests.push({ id: `${session.id}-guest-${key}`, name });
      }
      options.push({ id: session.id, title: session.title, speaker: "", timeLabel, sortKey: session.start, guests });
      continue;
    }
    options.push({ id: session.id, title: session.title, speaker: session.speaker, timeLabel, sortKey: session.start });
  }

  for (const conversation of conversations) {
    if (weekday(conversation.date) === "Thursday") continue;
    options.push({ id: `conv-${conversation.id}`, title: `1:1 with ${conversation.partner}`, speaker: "",
      timeLabel: `${conversation.day} · ${conversation.timeLabel}`, sortKey: conversation.start });
  }
  options.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  options.push({ id: "informal-socializing", title: "Informal socializing", speaker: "", timeLabel: "Throughout the conference", sortKey: "" });
  return options;
}

/** Keep guest response ids stable while displaying them inside their session. */
export function flattenSessionRatingOptions(options: SessionRatingOption[]): SessionRatingOption[] {
  return options.flatMap((option) => [option, ...(option.guests ?? []).map((guest) => ({
    id: guest.id, title: `Rotating Q&A with ${guest.name}`, speaker: "",
    timeLabel: option.timeLabel, sortKey: option.sortKey,
  }))]);
}

export async function sessionRatingOptions(participantId: string): Promise<SessionRatingOption[]> {
  const [sessions, conversations, guests] = await Promise.all([
    getSessions(), oneToOneConversations(participantId), getGuests(),
  ]);
  const privateGuestName = guests.find((guest) => guest.id === PRIVATE_QA_GUEST_ID)?.name ?? "Kuhan Jeyapragasan";
  return buildSessionRatingOptions(sessions, conversations, privateGuestName);
}
