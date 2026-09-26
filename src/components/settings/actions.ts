"use server";

import { prisma } from "@/lib/db";
import { signOut } from "@/lib/auth";
import { requireUser } from "@/lib/session";

export type DeleteState = { error?: string };

/**
 * GDPR Art. 17 erasure. Typed-email confirmation, then a single delete —
 * every relation in the schema cascades (profile, posts, likes, comments,
 * connections, messages, offers, drafts, company).
 */
export async function deleteAccount(_prev: DeleteState, formData: FormData): Promise<DeleteState> {
  const user = await requireUser();

  const confirmation = String(formData.get("confirm") ?? "").trim().toLowerCase();
  if (confirmation !== user.email?.toLowerCase()) {
    return { error: "Type your account email exactly to confirm deletion." };
  }

  await prisma.user.delete({ where: { id: user.id } });
  await signOut({ redirectTo: "/" });
  return {};
}
