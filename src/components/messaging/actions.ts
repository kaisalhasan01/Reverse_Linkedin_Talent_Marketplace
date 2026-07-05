"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/session";
import { createMessage } from "@/lib/messaging";

/** Reply in an existing thread. Shared by the candidate and company inboxes. */
export async function sendMessageAction(conversationId: string, formData: FormData) {
  const user = await requireUser();
  const parsed = z.string().trim().min(1).max(4000).safeParse(formData.get("body"));
  if (!parsed.success) return;

  await createMessage(conversationId, user.id, parsed.data);

  revalidatePath("/candidate/messages");
  revalidatePath("/company/messages");
}
