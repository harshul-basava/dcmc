import { redirect } from "next/navigation";
import { getSession } from "@/server/auth";
import { portalHome } from "@/server/portal-pages";

/** `/dashboard` is a signpost, not a page: it sends each role to its own home. */
export default async function DashboardIndex() {
  const session = await getSession();
  if (!session) redirect("/dashboard/login");
  if (session.role === "admin") redirect("/dashboard/admin");
  redirect(await portalHome(session.role));
}
