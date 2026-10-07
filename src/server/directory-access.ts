import { createHmac } from "node:crypto";
import { cookies } from "next/headers";
import { readSessionToken, sessionSecret } from "./session";

export const DIRECTORY_COOKIE = process.env.NODE_ENV === "production"
  ? "__Secure-dcmc_directory"
  : "dcmc_directory";

/** A separate signing key makes directory tokens invalid as dashboard sessions. */
export function directorySigningKey(): string | null {
  const secret = sessionSecret();
  return secret ? createHmac("sha256", secret).update("dcmc-directory-access-v1").digest("hex") : null;
}

export async function hasDirectoryAccess(): Promise<boolean> {
  const key = directorySigningKey();
  if (!key) return false;
  const token = (await cookies()).get(DIRECTORY_COOKIE)?.value;
  return readSessionToken(token, key)?.role === "admin";
}
