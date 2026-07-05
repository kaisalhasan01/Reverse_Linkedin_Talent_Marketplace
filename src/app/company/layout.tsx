import type { ReactNode } from "react";
import { requireCompany } from "@/lib/session";
import { prisma } from "@/lib/db";
import { TopNav, type NavItem } from "@/components/shared/top-nav";
import { UserMenu } from "@/components/shared/user-menu";
import { Badge } from "@/components/ui/badge";

const companyNav: NavItem[] = [
  { href: "/company/dashboard", label: "Dashboard" },
  { href: "/company/search", label: "Search candidates" },
  { href: "/company/messages", label: "Messages" },
  { href: "/company/billing", label: "Billing" },
];

const subscriptionBadge = {
  TRIALING: { tone: "amber" as const, label: "Trial" },
  ACTIVE: { tone: "green" as const, label: "Active plan" },
  CANCELED: { tone: "neutral" as const, label: "Canceled" },
};

/** Shell + auth guard for the company app: must be a signed-in COMPANY user. */
export default async function CompanyLayout({ children }: { children: ReactNode }) {
  const user = await requireCompany();
  const company = await prisma.company.findUnique({
    where: { ownerId: user.id },
    select: { name: true, subscriptionStatus: true },
  });
  const badge = subscriptionBadge[company?.subscriptionStatus ?? "TRIALING"];

  return (
    <div className="flex min-h-full flex-col">
      <TopNav
        brandHref="/company/dashboard"
        brandLabel="Reverse for Recruiters"
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
