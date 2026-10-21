import { createHmac, timingSafeEqual } from "node:crypto";
import { sessionSecret } from "./session";
import type { SessionRatingOption } from "./session-ratings";

/** Bind the exact options shown to this attendee. An organizer can update live
 * pairings while a form is open without discarding or relabelling its ratings. */
export function signFeedbackOptions(participantId: string, options: SessionRatingOption[]): string {
  const secret = sessionSecret();
  if (!secret) throw new Error("Dashboard signing is not configured");
  const payload = Buffer.from(JSON.stringify({ participantId, options })).toString("base64url");
  const signature = createHmac("sha256", secret).update(`feedback-options:${payload}`).digest("base64url");
  return `${payload}.${signature}`;
}

export function readFeedbackOptions(token: unknown, participantId: string): SessionRatingOption[] | null {
  const secret = sessionSecret();
  if (!secret || typeof token !== "string" || token.length > 500_000) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;
  const expected = createHmac("sha256", secret).update(`feedback-options:${payload}`).digest();
  const actual = Buffer.from(signature, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const value = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (value.participantId !== participantId || !Array.isArray(value.options)) return null;
    return value.options;
  } catch { return null; }
}
