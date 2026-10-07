"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DIRECTORY_COOKIE, directorySigningKey } from "@/server/directory-access";
import { createSessionToken, safeEqual, SESSION_TTL_SECONDS } from "@/server/session";

export async function unlockDirectory(formData: FormData) {
  const destination = formData.get("returnTo") === "/directory/schedule" ? "/directory/schedule" : "/directory";
  const password = formData.get("password");
  if (typeof password !== "string" || password.length > 256 || !safeEqual(password, "dcminiconf")) {
    redirect(`${destination}?error=password`);
  }
  const key = directorySigningKey();
  if (!key) redirect(`${destination}?error=unavailable`);

  (await cookies()).set(DIRECTORY_COOKIE, createSessionToken({ role: "admin" }, key), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/directory",
    maxAge: SESSION_TTL_SECONDS,
  });
  redirect(destination);
}
