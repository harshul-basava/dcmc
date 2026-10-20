import { createHmac } from "node:crypto";
import type { Participant } from "./data/types";

// Virtual identity: never inserted into the attendee roster or pairing pool.
export const TEST_PARTICIPANT_ID = "recTESTATTENDEE01";
export const TEST_PARTICIPANT: Participant = {
  id: TEST_PARTICIPANT_ID, name: "TEST Attendee", title: "Live testing",
  organization: "", school: "", bio: "Dedicated account for testing the attendee portal.",
  email: "", shortPassword: "", accessCount: 0, interests: [],
};

export function isTestParticipant(id: string | undefined): boolean {
  return id === TEST_PARTICIPANT_ID;
}

/** Server-only password, shown only on the authenticated admin Feedback page. */
export function testAttendeePassword(secret = process.env.DASHBOARD_SESSION_SECRET): string | null {
  if (!secret || secret.length < 32) return null;
  return createHmac("sha256", secret).update("dcmc-live-test-attendee-v1").digest("base64url").slice(0, 24);
}
