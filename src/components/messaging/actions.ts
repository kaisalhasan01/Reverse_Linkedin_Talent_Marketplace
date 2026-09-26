"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCandidate, requireUser } from "@/lib/session";
import { createMessage } from "@/lib/messaging";

function revalidateInboxes() {
  revalidatePath("/candidate/messages");
  revalidatePath("/company/messages");
}

/** Reply in an existing thread. Shared by the candidate and company inboxes. */
export async function sendMessageAction(conversationId: string, formData: FormData) {
  const user = await requireUser();
  const parsed = z.string().trim().min(1).max(4000).safeParse(formData.get("body"));
  if (!parsed.success) return;

  await createMessage(conversationId, user.id, parsed.data);
  revalidateInboxes();
}

/**
 * The candidate accepts or declines a job offer. Only the recipient — a
 * participant of the thread who didn't send it — can answer, and only
 * once; both rules live in the query. The answer is also posted to the
 * thread so the company sees it in their inbox.
 */
export async function respondToOffer(offerId: string, accept: boolean) {
  const user = await requireCandidate();

  const offer = await prisma.jobOffer.findFirst({
    where: {
      id: offerId,
      status: "PENDING",
      message: {
        senderId: { not: user.id },
        conversation: { participants: { some: { userId: user.id } } },
      },
    },
    select: { id: true, title: true, message: { select: { conversationId: true } } },
  });
  if (!offer) return;

  // Conditional update: a double submit can't answer twice.
  const { count } = await prisma.jobOffer.updateMany({
    where: { id: offer.id, status: "PENDING" },
    data: { status: accept ? "ACCEPTED" : "DECLINED", respondedAt: new Date() },
  });
  if (count === 0) return;

  await createMessage(
    offer.message.conversationId,
    user.id,
    accept
      ? `✅ Accepted your offer “${offer.title}” — happy to talk next steps.`
      : `Declined your offer “${offer.title}”. Thanks for reaching out.`,
  );
  revalidateInboxes();
}
