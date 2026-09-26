import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { companyAccess } from "@/lib/billing";
import { requireCompany } from "@/lib/session";

/**
 * Server-side enforcement of the paid-access policy in `billing.ts`, used
 * by the company pages and actions (data layer, not UI).
 */

/** The signed-in company, or a redirect to sign-in / the right home. */
export async function currentCompany() {
  const user = await requireCompany();
  const company = await prisma.company.findUniqueOrThrow({ where: { ownerId: user.id } });
  return { user, company, access: companyAccess(company) };
}

/** Guard for the paid features: without access, go to Billing and say why. */
export async function requirePaidAccess() {
  const ctx = await currentCompany();
  if (!ctx.access.allowed) redirect("/company/billing?locked=1");
  return ctx;
}
