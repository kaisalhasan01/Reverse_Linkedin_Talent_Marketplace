import type { ReactNode } from "react";
import { requireCompany } from "@/lib/session";
import { prisma } from "@/lib/db";
import { TopNav, type NavItem } from "@/components/shared/top-nav";
import { UserMenu } from "@/components/shared/user-menu";
import { Badge } from "@/components/ui/badge";
import { companyAccess } from "@/lib/billing";

const companyNav: NavItem[] = [
  { href: "/company/dashboard", label: "Dashboard" },
  { href: "/company/search", label: "Search candidates", short: "Search" },
  { href: "/company/messages", label: "Messages" },
  { href: "/company/billing", label: "Billing" },
];


/** Shell + auth guard for the company app: must be a signed-in COMPANY user. */
export default async function CompanyLayout({ children }: { children: ReactNode }) {
  const user = await requireCompany();
  const company = await prisma.company.findUnique({
    where: { ownerId: user.id },
    select: { name: true, subscriptionStatus: true, trialEndsAt: true },
  });
  const access = company ? companyAccess(company) : null;
  const badge = !access?.allowed
    ? { tone: "neutral" as const, label: access?.reason === "canceled" ? "Canceled" : "Trial ended" }
    : access.trialDaysLeft === null
      ? { tone: "green" as const, label: "Active plan" }
      : { tone: "amber" as const, label: `Trial · ${access.trialDaysLeft}d left` };

  return (
    <div className="flex min-h-full flex-col">
      <TopNav
        brandHref="/company/dashboard"
        brandSuffix="for Recruiters"
        items={companyNav}
        actions={
          <UserMenu
            name={company?.name ?? user.name ?? "Company"}
            settingsHref="/company/settings"
            badge={<Badge tone={badge.tone}>{badge.label}</Badge>}
          />
        }
      />
      <main className="flex-1">{children}</main>
    </div>
  );
}
