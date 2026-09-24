import { MAX_UPLOAD_BYTES } from "@/server/airtable";
import type { GuestProfileEdit } from "@/server/data";

/** What a browser may actually send us as a headshot. */
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export type GuestProfileError = "name" | "type" | "size";

export type ParsedGuestProfile =
  | { ok: true; edit: GuestProfileEdit; headshot: File | null }
  | { ok: false; error: GuestProfileError };

/**
 * Reads and validates the guest profile form.
 *
 * Shared by the guest's own editor and the organizer's, so a field an
 * organizer can set is never one a guest could not, and neither route can
 * quietly accept something the other rejects. The caller owns the redirect,
 * since the two live at different paths.
 */
export function readGuestProfile(formData: FormData): ParsedGuestProfile {
  const name = String(formData.get("name") ?? "").trim().slice(0, 200);
  if (!name) return { ok: false, error: "name" };

  const linkedin = String(formData.get("linkedin") ?? "").trim().slice(0, 500);
  // Accept a bare domain but store something a browser can follow.
  const url = linkedin && !/^https?:\/\//i.test(linkedin) ? `https://${linkedin}` : linkedin;

  const headshot = formData.get("headshot");
  const file = headshot instanceof File && headshot.size > 0 ? headshot : null;
  if (file) {
    if (!IMAGE_TYPES.has(file.type)) return { ok: false, error: "type" };
    if (file.size > MAX_UPLOAD_BYTES) return { ok: false, error: "size" };
  }

  return {
    ok: true,
    edit: {
      name,
      title: String(formData.get("title") ?? "").trim().slice(0, 200),
      organization: String(formData.get("organization") ?? "").trim().slice(0, 200),
      bio: String(formData.get("bio") ?? "").trim().slice(0, 4000),
      linkedin: url,
    },
    headshot: file,
  };
}

/** Copy for each rejection, keyed by the `?error=` the actions redirect with. */
export const GUEST_PROFILE_ERRORS: Record<GuestProfileError, string> = {
  name: "Give the guest a name.",
  type: "Headshots must be a JPEG, PNG or WebP image.",
  size: "That image is larger than 5MB. Please use a smaller one.",
};
