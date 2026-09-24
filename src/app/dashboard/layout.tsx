import type { Metadata } from "next";
import "./dashboard.css";

export const metadata: Metadata = {
  title: "Dashboard — DC Mini-Conference",
  // The dashboard is private; keep it out of every index.
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Nothing under /dashboard may ever be prerendered: every page depends on who
 * is asking. Belt and braces alongside the cookie read in `getSession`.
 */
export const dynamic = "force-dynamic";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
