import { getPortalPageSettings } from "./data";
import type { Role } from "./data/types";

/**
 * The catalogue of pages an admin can open or close per audience, and the
 * order they appear in the nav. Mirrors the source dashboard's PORTAL_PAGES:
 * a fixed list in code, with only the enabled flag stored as data.
 */
export type PortalPage = {
  role: Exclude<Role, "admin">;
  key: string;
  path: string;
  label: string;
};

export const PORTAL_PAGES: PortalPage[] = [
  { role: "participant", key: "schedule", path: "/dashboard/schedule", label: "Schedule" },
  { role: "participant", key: "profile", path: "/dashboard/profile", label: "Your profile" },
  { role: "participant", key: "directory", path: "/dashboard/directory", label: "Attendee directory" },
  { role: "participant", key: "guests", path: "/dashboard/guests", label: "Guest directory" },
  { role: "participant", key: "feedback", path: "/dashboard/feedback", label: "Feedback" },
  { role: "participant", key: "readings", path: "/dashboard/readings", label: "Reading list" },
  { role: "participant", key: "handbook", path: "/dashboard/handbook", label: "Handbook" },
  { role: "guest", key: "program", path: "/dashboard/guest", label: "Schedule" },
  { role: "guest", key: "directory", path: "/dashboard/directory", label: "Attendee directory" },
];

export const ADMIN_PAGES = [
  // Overview is removed for now; /dashboard/admin redirects to whatever is
  // first here.
  { key: "people", path: "/dashboard/admin/people", label: "People" },
  { key: "schedule", path: "/dashboard/admin/schedule", label: "Schedule" },
  { key: "pairings", path: "/dashboard/admin/pairings", label: "Pairings ·  WIP" },
  { key: "feedback", path: "/dashboard/admin/feedback", label: "Feedback ·  WIP" },
  { key: "pages", path: "/dashboard/admin/pages", label: "Portal pages" },
];

/**
 * Settings that gate something other than a nav entry. Kept out of
 * PORTAL_PAGES so saving nav choices can never accidentally flip them.
 */
export const HANDBOOK_RESOURCES_KEY = "handbook-resources";

/** Whether the Conference resources section is open inside the handbook. */
export async function handbookResourcesOpen(): Promise<boolean> {
  const settings = await getPortalPageSettings();
  const stored = settings.find(
    (s) => s.audience === "all" && s.key === HANDBOOK_RESOURCES_KEY,
  );
  return stored?.enabled ?? true;
}

/** Pages default to open; only an explicit stored row can close one. */
export async function portalPageState(): Promise<Map<string, boolean>> {
  const state = new Map<string, boolean>();
  for (const page of PORTAL_PAGES) state.set(`${page.role}:${page.key}`, true);
  for (const setting of await getPortalPageSettings()) {
    const id = `${setting.audience}:${setting.key}`;
    if (state.has(id)) state.set(id, setting.enabled);
  }
  return state;
}

export async function portalPagesFor(role: Exclude<Role, "admin">): Promise<PortalPage[]> {
  const state = await portalPageState();
  return PORTAL_PAGES.filter((page) => page.role === role && state.get(`${page.role}:${page.key}`));
}

/** Where a role lands after signing in: its first page that is still open. */
export async function portalHome(role: Exclude<Role, "admin">): Promise<string> {
  const pages = await portalPagesFor(role);
  return pages[0]?.path ?? "/dashboard/closed";
}

export async function portalPageOpen(role: Exclude<Role, "admin">, key: string): Promise<boolean> {
  const state = await portalPageState();
  return state.get(`${role}:${key}`) ?? false;
}
