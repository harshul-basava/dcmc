"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/server/auth";
import { getGuest, saveGuestProfile, saveHeadshot } from "@/server/data";
import { readGuestProfile } from "@/server/guest-profile";

/**
 * An organizer filling in a guest's directory profile on their behalf.
 *
 * Speakers rarely log in to write their own bio, so the same profile has to
 * be reachable from the admin side. It writes through the same function and
 * the same validation the guest's own editor uses.
 */
export async function updateGuestProfileAsAdmin(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  // The id arrives in the form body, so it is checked against the roster
  // rather than trusted as a record id to patch.
  const guest = await getGuest(id);
  if (!guest) redirect("/dashboard/admin/people");

  const here = `/dashboard/admin/guests/${id}`;
  const parsed = readGuestProfile(formData);
  if (!parsed.ok) redirect(`${here}?error=${parsed.error}`);

  await saveGuestProfile(id, parsed.edit);

  if (parsed.headshot) {
    await saveHeadshot(
      id,
      {
        buffer: Buffer.from(await parsed.headshot.arrayBuffer()),
        contentType: parsed.headshot.type,
        filename: parsed.headshot.name || "headshot",
      },
      "guest",
    );
  }

  revalidatePath("/dashboard", "layout");
  redirect(`${here}?saved=1`);
}
