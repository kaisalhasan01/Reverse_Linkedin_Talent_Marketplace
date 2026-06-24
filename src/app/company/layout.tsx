import type { ReactNode } from "react";
import { TopNav, type NavItem } from "@/components/shared/top-nav";

const companyNav: NavItem[] = [
  { href: "/company/dashboard", label: "Dashboard" },
  { href: "/company/search", label: "Search candidates" },
  { href: "/company/messages", label: "Messages" },
  { href: "/company/billing", label: "Billing" },
];

/**
 * Shell for the company-facing app (role: COMPANY). In Phase 3 this layout
 * guards the routes; later it also checks for an active subscription before
 * unlocking candidate search.
 */
export default function CompanyLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <TopNav
        brandHref="/company/dashboard"
        brandLabel="Reverse for Recruiters"
        items={companyNav}
        actions={
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
            Trial
          </span>
        }
      />
      <main className="flex-1">{children}</main>
    </div>
  );
}
