import { requireParticipant, requireSession } from "./auth";

/** Contact details and PDFs have the same attendee-only authorization. */
export async function requireSpeakerContactsViewer() {
  const session = await requireSession("/dashboard/handbook/speaker-contacts");
  if (session.role !== "admin") await requireParticipant("handbook");
  return session;
}
