"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCompany } from "@/lib/session";
import { createMessage, getOrCreateConversation } from "@/lib/messaging";

const outreachSchema = z.object({
  body: z.string().trim().min(1, "Write a message").max(4000),
  offerTitle: z.string().trim().max(120).optional(),
  salaryMin: z.union([z.coerce.number().int().positive(), z.literal("")]).optional(),
  salaryMax: z.union([z.coerce.number().int().positive(), z.literal("")]).optional(),
  hoursPerWeek: z.union([z.coerce.number().int().min(1).max(80), z.literal("")]).optional(),
  offerLocation: z.string().trim().max(120).optional(),
});

/**
 * Company reaches out to a candidate: opens (or reuses) the 1:1 thread and
 * sends a message, optionally with a structured job offer attached.
 */
export async function startOutreach(candidateUserId: string, formData: FormData) {
  const user = await requireCompany();

  // Only candidates who are actively looking can be contacted.
  const target = await prisma.candidateProfile.findFirst({
    where: { userId: candidateUserId, status: "LOOKING" },
    select: { id: true },
  });
  if (!target) return;

  const parsed = outreachSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const d = parsed.data;

  const conversation = await getOrCreateConversation(user.id, candidateUserId);
  await createMessage(
    conversation.id,
    user.id,
    d.body,
    d.offerTitle
      ? {
          title: d.offerTitle,
          salaryMin: typeof d.salaryMin === "number" ? d.salaryMin : undefined,
          salaryMax: typeof d.salaryMax === "number" ? d.salaryMax : undefined,
          hoursPerWeek: typeof d.hoursPerWeek === "number" ? d.hoursPerWeek : undefined,
          location: d.offerLocation ?? "",
        }
      : undefined,
  );

  redirect(`/company/messages?c=${conversation.id}`);
}
