import { createHmac, createHash, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Signed, stateless dashboard sessions — the same model the AI risk workshop
 * dashboard uses: the cookie carries only a role and a record id, HMAC-signed
 * with a server-only secret. No session store, and nothing in the cookie is
 * trusted until the signature verifies.
 *
 * Deliberately *not* a JWT. There is no algorithm field to confuse, and no
 * library that might honour `alg: none`.
 */

export type Role = "participant" | "guest" | "admin";

export type SessionClaims =
  | { role: "admin" }
  | { role: "participant"; participantId: string }
  | { role: "guest"; guestId: string };

export type Session = SessionClaims & { expiresAt: number };

export const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours

/**
 * `__Secure-` is only honoured by browsers over HTTPS, so a dev server on
 * plain http://localhost could never store it. The prefix and the `Secure`
 * attribute travel together, decided once here.
 */
const SECURE = process.env.NODE_ENV === "production";
export const SESSION_COOKIE = SECURE
  ? "__Secure-dcmc_dashboard"
  : "dcmc_dashboard";

/** Airtable record-id shape, kept so ids stay valid when the real base lands. */
const RECORD_ID = /^rec[A-Za-z0-9]{14}$/;

export function sessionSecret(): string | null {
  const secret = process.env.DASHBOARD_SESSION_SECRET;
  // A short secret is worse than none: it looks configured but isn't.
  if (!secret || secret.length < 32) return null;
  return secret;
}

export function adminPassword(): string | null {
  return process.env.DASHBOARD_ADMIN_PASSWORD || null;
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

/**
 * Constant-time compare over digests, so inputs of differing length don't leak
 * their length through an early return.
 */
export function safeEqual(left: string, right: string): boolean {
  const a = createHash("sha256").update(String(left)).digest();
  const b = createHash("sha256").update(String(right)).digest();
  return timingSafeEqual(a, b);
}

export function createSessionToken(claims: SessionClaims, secret: string): string {
  const body = {
    ...claims,
    expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000,
    // Makes two sessions issued in the same millisecond distinct tokens.
    nonce: randomBytes(16).toString("hex"),
  };
  const payload = base64url(JSON.stringify(body));
  return `${payload}.${sign(payload, secret)}`;
}

export function readSessionToken(token: string | undefined, secret: string): Session | null {
  if (!token) return null;
  const dot = token.indexOf(".");
  if (dot < 1) return null;

  const payload = token.slice(0, dot);
  if (!safeEqual(token.slice(dot + 1), sign(payload, secret))) return null;

  let claims: Record<string, unknown>;
  try {
    claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  const expiresAt = Number(claims.expiresAt);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return null;

  // Shape-check per role. A signed token with the wrong fields for its role is
  // treated as forged rather than coerced into something usable.
  if (claims.role === "admin") return { role: "admin", expiresAt };
  if (claims.role === "participant" && RECORD_ID.test(String(claims.participantId))) {
    return { role: "participant", participantId: String(claims.participantId), expiresAt };
  }
  if (claims.role === "guest" && RECORD_ID.test(String(claims.guestId))) {
    return { role: "guest", guestId: String(claims.guestId), expiresAt };
  }
  return null;
}

/** Options shared by every write of the session cookie, including the clear. */
export function sessionCookieOptions(maxAge: number = SESSION_TTL_SECONDS) {
  return {
    httpOnly: true,
    secure: SECURE,
    sameSite: "strict" as const,
    path: "/dashboard",
    maxAge,
  };
}
