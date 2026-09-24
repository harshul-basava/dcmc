import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  readSessionToken,
  sessionSecret,
  type Session,
} from "./session";
import { getGuest, getParticipant } from "./data";
import type { Guest, Participant } from "./data/types";
import { portalHome, portalPageOpen } from "./portal-pages";

/**
 * The signed-in session, or null. Every page calls this and re-verifies the
 * signature; the root `proxy.ts` check is only a fast path, never the
 * authorization boundary.
 */
export async function getSession(): Promise<Session | null> {
  // Read the cookie first, before any early return. Touching cookies() is what
  // marks the route dynamic; bailing out above it would let Next prerender a
  // signed-out redirect at build time and serve it to everyone.
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;

  const secret = sessionSecret();
  if (!secret) return null;
  return readSessionToken(token, secret);
}

/** Sends anyone without a session to the login screen, preserving where they were headed. */
export async function requireSession(returnTo?: string): Promise<Session> {
  const session = await getSession();
  if (!session) {
    redirect(returnTo ? `/dashboard/login?returnTo=${encodeURIComponent(returnTo)}` : "/dashboard/login");
  }
  return session;
}

export async function requireParticipant(pageKey: string): Promise<Participant> {
  const session = await requireSession();
  if (session.role !== "participant") redirect("/dashboard");

  // A page an admin has closed must refuse direct requests too, not merely
  // disappear from the nav.
  if (!(await portalPageOpen("participant", pageKey))) redirect(await portalHome("participant"));

  const person = await getParticipant(session.participantId);
  // The session is validly signed but names nobody — clear it rather than
  // redirecting to sign-in, which would bounce straight back here.
  if (!person) redirect("/dashboard/session/clear");
  return person;
}

export async function requireGuest(pageKey: string): Promise<Guest> {
  const session = await requireSession();
  if (session.role !== "guest") redirect("/dashboard");
  if (!(await portalPageOpen("guest", pageKey))) redirect(await portalHome("guest"));

  const person = await getGuest(session.guestId);
  if (!person) redirect("/dashboard/session/clear");
  return person;
}

/**
 * Admin pages 404 rather than 403 for everyone else — the operations surface
 * does not advertise that it exists.
 */
export async function requireAdmin(): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "admin") notFound();
}

/** The directory is shared by participants and guests. */
export async function requireDirectoryViewer(): Promise<Session> {
  const session = await requireSession("/dashboard/directory");
  if (session.role === "admin") return session;
  const role = session.role;
  if (!(await portalPageOpen(role, role === "participant" ? "directory" : "directory"))) {
    redirect(await portalHome(role));
  }
  return session;
}
