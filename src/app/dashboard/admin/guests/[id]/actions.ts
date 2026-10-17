"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/server/auth";
import { getGuest, saveGuestProfile, saveHeadshot, setGuestHidden } from "@/server/data";
import { readGuestProfile } from "@/server/guest-profile";
import { sniffImageType } from "@/server/airtable";

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
    // The browser's type comes from the file name; check what it really is.
    const buffer = Buffer.from(await parsed.headshot.arrayBuffer());
    const contentType = sniffImageType(buffer);
    if (!contentType) redirect(`${here}?error=type`);

    await saveHeadshot(
      id,
      {
        buffer,
        contentType,
        filename: parsed.headshot.name || "headshot",
      },
      "guest",
    );
  }

  revalidatePath("/dashboard", "layout");
  redirect(`${here}?saved=1`);
}

/** Shows or hides a guest in the guest directory, independent of their profile. */
export async function setGuestDirectoryVisibility(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!(await getGuest(id))) redirect("/dashboard/admin/people");

  await setGuestHidden(id, formData.get("hidden") === "true");
  revalidatePath("/dashboard", "layout");
  redirect(`/dashboard/admin/guests/${id}`);
}
