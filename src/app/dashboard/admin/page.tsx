import { redirect } from "next/navigation";
import { requireAdmin } from "@/server/auth";
import { ADMIN_PAGES } from "@/server/portal-pages";

/**
 * The admin landing route, with the Overview page removed for now.
 *
 * Kept as a redirect rather than deleted: sign-in, the wordmark and several
 * redirects all point here, and a bookmark to it should still work. It
 * forwards to whichever page the nav lists first, so it follows the nav
 * rather than naming a page that could itself move.
 */
export default async function AdminHome() {
  await requireAdmin();
  redirect(ADMIN_PAGES[0].path);
}
