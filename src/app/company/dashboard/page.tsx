import Link from "next/link";
import { prisma } from "@/lib/db";
import { LOCKED_REASON } from "@/lib/billing";
import { currentCompany } from "@/lib/paid-access";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { daysAgo } from "@/lib/format";

export default async function DashboardPage() {
  const { user, company, access } = await currentCompany();

  const weekAgo = daysAgo(7);
  const [lookingCount, newThisWeek, conversationCount, offersSent, offersAccepted, recent] = await Promise.all([
    prisma.candidateProfile.count({ where: { status: "LOOKING" } }),
    prisma.candidateProfile.count({ where: { status: "LOOKING", user: { createdAt: { gte: weekAgo } } } }),
    prisma.conversation.count({ where: { participants: { some: { userId: user.id } } } }),
    prisma.jobOffer.count({ where: { message: { senderId: user.id } } }),
    prisma.jobOffer.count({ where: { message: { senderId: user.id }, status: "ACCEPTED" } }),
    // Candidate names are the paid product — only load them with access.
    access.allowed
      ? prisma.candidateProfile.findMany({
          where: { status: "LOOKING" },
          orderBy: { updatedAt: "desc" },
          take: 5,
          include: { user: { select: { name: true } } },
        })
      : Promise.resolve([]),
  ]);

  const stats = [
    { label: "Candidates looking now", value: lookingCount },
    { label: "New this week", value: newThisWeek },
    { label: "Your conversations", value: conversationCount },
    { label: "Offers sent", value: offersSent, hint: `${offersAccepted} accepted` },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Welcome back, {company.name}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            The talent pool is live — here&apos;s what&apos;s moving.
          </p>
        </div>
        <Link href={access.allowed ? "/company/search" : "/company/billing"} className={buttonStyles()}>
          {access.allowed ? "Search candidates" : "Choose a plan"}
        </Link>
      </div>

      {!access.allowed ? (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
          <span className="font-semibold">{LOCKED_REASON[access.reason]}.</span> {lookingCount} candidates are
          looking right now — choose a plan to search and contact them.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <p className="text-3xl font-semibold tracking-tight">{s.value}</p>
            <p className="mt-1 text-sm text-zinc-500">
              {s.label}
              {"hint" in s ? <span className="text-emerald-700 dark:text-emerald-400"> · {s.hint}</span> : null}
            </p>
          </Card>
        ))}
      </div>

      {access.allowed ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Recently active candidates
          </h2>
          <div className="space-y-3">
            {recent.map((p) => (
              <Card key={p.id} className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={p.user.name} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{p.user.name}</p>
                    <p className="truncate text-xs text-zinc-500">{p.headline}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Badge tone="green">Looking</Badge>
                  <Link
                    href={`/company/candidates/${p.id}`}
                    className={buttonStyles({ variant: "outline", size: "sm" })}
                  >
                    View
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
