"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth";
import { getAssignments, getGuests, getParticipants, getSessions, replaceAssignments } from "@/server/data";
import { pairingRoster } from "@/server/pairing-roster";
import type { PairingPlan } from "@/lib/pairing-planner";
import { planAssignments } from "@/lib/pairing-planner";

export async function savePairingDraft(sessionId: string, serialized: string): Promise<{ error?: string; saved?: true }> {
  await requireAdmin();
  if (serialized.length > 500_000) return { error: "This draft is too large to save." };
  const [sessions, participants, guests, assignments] = await Promise.all([getSessions(), getParticipants(), getGuests(), getAssignments()]);
  const session = sessions.find((s) => s.id === sessionId && s.type === "one-to-one");
  if (!session) return { error: "This 1:1 block no longer exists. Reload the page." };
  let value: unknown;
  try { value = JSON.parse(serialized); } catch { return { error: "The draft could not be read." }; }
  const rows = planAssignments(value, sessionId, pairingRoster(session, participants, guests, assignments).halves, { allowIncomplete: true });
  if (!rows) return { error: "Each person must be available for their half and appear in only one pair per half." };
  try {
    await replaceAssignments([sessionId], rows, "draft", [(value as PairingPlan)[0].groups.length, (value as PairingPlan)[1].groups.length]);
  } catch {
    return { error: "The draft could not be saved. Your edits are still here; try again." };
  }
  revalidatePath("/dashboard", "layout");
  return { saved: true };
}
