"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  adminPassword,
  createSessionToken,
  safeEqual,
  sessionCookieOptions,
} from "@/server/session";
import { MAX_PASSWORD_LENGTH, findPersonByPassword, recordLogin } from "@/server/data";
import { portalHome } from "@/server/portal-pages";

/**
 * Only these paths may be carried through a sign-in, so a `returnTo` can never
 * become an open redirect. Anything else falls back to the role's home page.
 */
const LOGIN_RETURN_PATHS = new Set([
  "/dashboard/schedule",
  "/dashboard/directory",
  "/dashboard/guests",
  "/dashboard/feedback",
  "/dashboard/readings",
  "/dashboard/handbook",
]);

function safeReturnTo(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  // Reject protocol-relative and absolute URLs before the allowlist check.
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  const path = value.split("?")[0];
  return LOGIN_RETURN_PATHS.has(path) ? value : null;
}

export async function signIn(_state: { error: string } | null, formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const returnTo = safeReturnTo(formData.get("returnTo"));

  // One message for every failure: it must not reveal which roster a phrase
  // was close to matching, or whether the admin password exists.
  const failure = { error: "That password isn't correct." };

  if (!password || password.length > MAX_PASSWORD_LENGTH) return failure;

  const secret = process.env.DASHBOARD_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    return { error: "The dashboard is not configured. Set DASHBOARD_SESSION_SECRET." };
  }

  const store = await cookies();

  // Admin first, then the rosters — matching the source dashboard's order.
  const admin = adminPassword();
  if (admin && safeEqual(password, admin)) {
    store.set(SESSION_COOKIE, createSessionToken({ role: "admin" }, secret), sessionCookieOptions());
    redirect("/dashboard/admin");
  }

  const match = await findPersonByPassword(password);
  if (!match) return failure;

  const claims =
    match.role === "participant"
      ? ({ role: "participant", participantId: match.id } as const)
      : ({ role: "guest", guestId: match.id } as const);

  store.set(SESSION_COOKIE, createSessionToken(claims, secret), sessionCookieOptions());
  // Fail-open: a counter that can't be written must never block a sign-in.
  try {
    await recordLogin(match);
  } catch {}

  redirect(returnTo ?? (await portalHome(match.role)));
}

export async function signOut() {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", sessionCookieOptions(0));
  redirect("/dashboard/login");
}
