import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { PREVIEW_COOKIE, SESSION_COOKIE, sessionCookieOptions } from "@/server/session";

/**
 * Drops a session that no longer resolves to a person — the roster changed
 * underneath it, or the record was deleted.
 *
 * This exists because cookies cannot be written while a page renders. Without
 * it the stale session loops: the page bounces to the sign-in screen, which
 * sees a validly-signed session and bounces straight back.
 */
export async function GET(request: NextRequest) {
  const store = await cookies();
  // A preview of an attendee who has since left the roster: end the preview
  // and keep the admin signed in.
  if (store.has(PREVIEW_COOKIE)) {
    store.set(PREVIEW_COOKIE, "", sessionCookieOptions(0));
    return NextResponse.redirect(new URL("/dashboard/admin/people", request.url));
  }
  store.set(SESSION_COOKIE, "", sessionCookieOptions(0));
  return NextResponse.redirect(new URL("/dashboard/login", request.url));
}
