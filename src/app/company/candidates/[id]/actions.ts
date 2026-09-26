"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { LOCKED_REASON } from "@/lib/billing";
import { currentCompany } from "@/lib/paid-access";
import { LIMITS, rateLimit, retryIn } from "@/lib/rate-limit";
import { createMessage, getOrCreateConversation } from "@/lib/messaging";
import { outreachSchema } from "@/lib/validation";

/** `values` echoes the submission so the form keeps the recruiter's text on error. */
export type OutreachState = { error?: string; values?: Record<string, string> };

/**
 * Company reaches out to a candidate: opens (or reuses) the 1:1 thread and
 * sends a message, optionally with a structured job offer attached.
 */
export async function startOutreach(
  candidateUserId: string,
  _prev: OutreachState,
  formData: FormData,
): Promise<OutreachState> {
  const { user, access } = await currentCompany();
  const values: Record<string, string> = {};
  for (const [key, value] of formData) {
    if (typeof value === "string" && !key.startsWith("$")) values[key] = value; // skip React's $ACTION_* fields
  }

  if (!access.allowed) {
    return {
      error: `${LOCKED_REASON[access.reason]} — choose a plan on the Billing page to contact candidates.`,
      values,
    };
  }

  // Only candidates who are actively looking can be contacted.
  const target = await prisma.candidateProfile.findFirst({
    where: { userId: candidateUserId, status: "LOOKING" },
    select: { id: true },
  });
  if (!target) return { error: "This candidate isn't available any more.", values };

  const parsed = outreachSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0].message, values };
  const d = parsed.data;

  // Anti-spam: generous for real recruiting, a hard stop for bulk messaging.
  const limited = await rateLimit(`outreach:${user.id}`, LIMITS.outreachPerCompany);
  if (!limited.ok) {
    return { error: `Daily outreach limit reached. Try again in ${retryIn(limited.retryAfterSeconds)}.`, values };
  }

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
