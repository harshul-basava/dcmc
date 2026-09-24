import { NextResponse, type NextRequest } from "next/server";

/**
 * A cheap presence check, not an authorization boundary.
 *
 * Next's own guidance is that middleware should not be used for session
 * verification, so this only asks whether a session cookie exists at all and
 * redirects to the sign-in screen when it doesn't. Every page still verifies
 * the signature server-side in `getSession()`; forging this cookie gets you a
 * rejected session, not access.
 */
const SESSION_COOKIE =
  process.env.NODE_ENV === "production" ? "__Secure-dcmc_dashboard" : "dcmc_dashboard";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // The sign-in screen must stay reachable without one.
  if (pathname === "/dashboard/login") return NextResponse.next();

  if (!request.cookies.has(SESSION_COOKIE)) {
    const url = new URL("/dashboard/login", request.url);
    url.searchParams.set("returnTo", pathname);
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next();
  // Nothing behind the sign-in should be cached by a proxy or indexed.
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return response;
}

export const config = {
  matcher: "/dashboard/:path*",
};
