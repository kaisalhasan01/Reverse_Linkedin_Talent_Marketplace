import type { Company } from "@prisma/client";

/**
 * Paid access. Companies pay to search and reach candidates — so search,
 * candidate profiles and outreach are open only while the subscription is
 * ACTIVE or the free trial is still running. This module is the pure
 * policy; `paid-access.ts` enforces it server-side in pages and actions.
 * Stripe will set `subscriptionStatus`; everything works off that field.
 */

export const TRIAL_DAYS = 14;
const DAY_MS = 24 * 3600 * 1000;

export type CompanyAccess =
  | { allowed: true; trialDaysLeft: number | null }
  | { allowed: false; reason: "trial_ended" | "canceled" };

export function companyAccess(
  company: Pick<Company, "subscriptionStatus" | "trialEndsAt">,
  now: Date = new Date(),
): CompanyAccess {
  if (company.subscriptionStatus === "ACTIVE") return { allowed: true, trialDaysLeft: null };
  if (company.subscriptionStatus === "TRIALING" && company.trialEndsAt && company.trialEndsAt > now) {
    return {
      allowed: true,
      trialDaysLeft: Math.ceil((company.trialEndsAt.getTime() - now.getTime()) / DAY_MS),
    };
  }
  // Fail closed: a trial without an end date counts as ended.
  return { allowed: false, reason: company.subscriptionStatus === "CANCELED" ? "canceled" : "trial_ended" };
}

/** Why a company is locked out — shared by Billing, the dashboard and outreach. */
export const LOCKED_REASON = {
  trial_ended: "Your free trial has ended",
  canceled: "Your subscription is canceled",
} as const;

export function trialEndDate(from: Date = new Date()) {
  return new Date(from.getTime() + TRIAL_DAYS * DAY_MS);
}
