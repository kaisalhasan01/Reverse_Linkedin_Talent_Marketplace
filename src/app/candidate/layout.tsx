import type { ReactNode } from "react";
import { requireCandidate } from "@/lib/session";
import { prisma } from "@/lib/db";
import { TopNav, type NavItem } from "@/components/shared/top-nav";
import { UserMenu } from "@/components/shared/user-menu";
import { Badge } from "@/components/ui/badge";

const candidateNav: NavItem[] = [
  { href: "/candidate/feed", label: "Feed" },
  { href: "/candidate/profile", label: "Profile" },
  { href: "/candidate/connections", label: "Connections" },
  { href: "/candidate/messages", label: "Messages" },
];

/** Shell + auth guard for the candidate app: must be a signed-in CANDIDATE. */
export default async function CandidateLayout({ children }: { children: ReactNode }) {
  const user = await requireCandidate();
  const profile = await prisma.candidateProfile.findUnique({
    where: { userId: user.id },
    select: { status: true },
  });
  const looking = profile?.status === "LOOKING";

  return (
    <div className="flex min-h-full flex-col">
      <TopNav
        brandHref="/candidate/feed"
        items={candidateNav}
        actions={
          <UserMenu
            name={user.name ?? "You"}
            badge={
              <Badge tone={looking ? "green" : "neutral"}>
                {looking ? "Looking for work" : "Employed"}
              </Badge>
            }
          />
        }
      />
      <main className="flex-1">{children}</main>
    </div>
  );
}
