import type { ReactNode } from "react";
import { TopNav, type NavItem } from "@/components/shared/top-nav";

const candidateNav: NavItem[] = [
  { href: "/candidate/feed", label: "Feed" },
  { href: "/candidate/profile", label: "Profile" },
  { href: "/candidate/connections", label: "Connections" },
  { href: "/candidate/messages", label: "Messages" },
];

/**
 * Shell for the candidate-facing app (role: CANDIDATE). In Phase 3 this layout
 * becomes the guard that redirects anyone who isn't a signed-in candidate.
 */
export default function CandidateLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <TopNav
        brandHref="/candidate/feed"
        items={candidateNav}
        actions={
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
            Looking for work
          </span>
        }
      />
      <main className="flex-1">{children}</main>
    </div>
  );
}
