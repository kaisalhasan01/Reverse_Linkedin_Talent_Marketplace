import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireCompany } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { OutreachForm } from "@/components/company/outreach-form";
import { ProfileDisplay, fullProfileInclude } from "@/components/profile/profile-display";
import { startOutreach } from "./actions";

export default async function CandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireCompany();
  const { id } = await params;

  // Employed candidates are hidden from companies by design — the status is
  // part of the query, and a hidden profile renders exactly like a missing
  // one, so a stale link doesn't even reveal that the person switched status.
  const profile = await prisma.candidateProfile.findFirst({
    where: { id, status: "LOOKING" },
    include: fullProfileInclude,
  });
  if (!profile) return <ProfileUnavailable />;

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-6 px-6 py-8 lg:grid-cols-[1fr_320px]">
      <div>
        <Link href="/company/search" className="text-sm text-zinc-500 hover:text-foreground">
          ← Back to search
        </Link>
        <div className="mt-4">
          <ProfileDisplay profile={profile} />
        </div>
      </div>

      {/* Outreach panel */}
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <Card className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold">Reach out to {profile.user.name.split(" ")[0]}</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Candidates on Reverse expect real terms up front — attach a concrete offer for the best reply rate.
            </p>
          </div>
          <OutreachForm action={startOutreach.bind(null, profile.userId)} />
        </Card>
      </aside>
    </div>
  );
}

function ProfileUnavailable() {
  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-16 text-center">
      <h1 className="text-lg font-semibold">This profile isn&apos;t available</h1>
      <p className="mt-2 text-sm text-zinc-500">
        The candidate may have hidden their profile from companies, or the link is wrong.
      </p>
      <Link href="/company/search" className="mt-6 inline-block">
        <Button variant="outline">Back to search</Button>
      </Link>
    </div>
  );
}
