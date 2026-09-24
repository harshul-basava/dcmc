"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireGuest } from "@/server/auth";
import { saveAvailability, saveBio } from "@/server/data";
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

export async function updateGuestBio(formData: FormData) {
  const me = await requireGuest("program");
  await saveBio("guest", me.id, String(formData.get("bio") ?? ""));
  revalidatePath("/dashboard/guest");
  redirect("/dashboard/guest?view=bio&saved=1");
}
