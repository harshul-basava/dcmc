"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireParticipant } from "@/server/auth";
import { saveHeadshot, saveProfile } from "@/server/data";
import { MAX_UPLOAD_BYTES } from "@/server/airtable";

/** What a browser may actually send us as a headshot. */
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function updateProfile(formData: FormData) {
  const me = await requireParticipant("profile");

  const firstName = String(formData.get("firstName") ?? "").trim().slice(0, 100);
  const lastName = String(formData.get("lastName") ?? "").trim().slice(0, 100);

  if (!firstName && !lastName) redirect("/dashboard/profile?error=name");

  const linkedin = String(formData.get("linkedin") ?? "").trim().slice(0, 500);
  // Accept a bare domain but store something a browser can follow.
  const url = linkedin && !/^https?:\/\//i.test(linkedin) ? `https://${linkedin}` : linkedin;

  await saveProfile(me.id, {
    firstName,
    lastName,
    bio: String(formData.get("bio") ?? "").trim().slice(0, 4000),
    linkedin: url,
  });

  const headshot = formData.get("headshot");
  if (headshot instanceof File && headshot.size > 0) {
    if (!IMAGE_TYPES.has(headshot.type)) redirect("/dashboard/profile?error=type");
    if (headshot.size > MAX_UPLOAD_BYTES) redirect("/dashboard/profile?error=size");

    await saveHeadshot(me.id, {
      buffer: Buffer.from(await headshot.arrayBuffer()),
      contentType: headshot.type,
      filename: headshot.name || "headshot",
    });
  }

  revalidatePath("/dashboard", "layout");
  redirect("/dashboard/profile?saved=1");
}
