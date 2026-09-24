"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireGuest } from "@/server/auth";
import { saveAvailability, saveGuestProfile, saveHeadshot } from "@/server/data";
import { readGuestProfile } from "@/server/guest-profile";
import { serializeAvailability } from "@/server/availability";

export async function updateAvailability(formData: FormData) {
  const me = await requireGuest("program");

  // Every checked box is one 15-minute slot, named `slot-<date>|<minutes>`.
  const slots = [...formData.keys()]
    .filter((name) => name.startsWith("slot-"))
    .map((name) => name.slice(5));

  await saveAvailability(me.id, serializeAvailability(slots));
  revalidatePath("/dashboard/guest");
  redirect("/dashboard/guest?view=availability&saved=1");
}

export async function updateGuestProfile(formData: FormData) {
  const me = await requireGuest("program");

  const parsed = readGuestProfile(formData);
  if (!parsed.ok) redirect(`/dashboard/guest?view=profile&error=${parsed.error}`);

  await saveGuestProfile(me.id, parsed.edit);

  if (parsed.headshot) {
    await saveHeadshot(
      me.id,
      {
        buffer: Buffer.from(await parsed.headshot.arrayBuffer()),
        contentType: parsed.headshot.type,
        filename: parsed.headshot.name || "headshot",
      },
      "guest",
    );
  }

  // The header and the guest directory both read this profile.
  revalidatePath("/dashboard", "layout");
  redirect("/dashboard/guest?view=profile&saved=1");
}
