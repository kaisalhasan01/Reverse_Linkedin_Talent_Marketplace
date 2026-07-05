import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireCompany } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/input";
import { ProfileDisplay, fullProfileInclude } from "@/components/profile/profile-display";
import { startOutreach } from "./actions";

export default async function CandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireCompany();
  const { id } = await params;

  const profile = await prisma.candidateProfile.findUnique({
    where: { id },
    include: fullProfileInclude,
  });
  if (!profile) notFound();

  // Employed candidates are hidden from companies by design.
  if (profile.status !== "LOOKING") {
    return (
      <div className="mx-auto w-full max-w-2xl px-6 py-16 text-center">
        <h1 className="text-lg font-semibold">This candidate is no longer available</h1>
        <p className="mt-2 text-sm text-zinc-500">
          They&apos;ve switched their status to Employed and are hidden from search.
        </p>
        <Link href="/company/search" className="mt-6 inline-block">
          <Button variant="outline">Back to search</Button>
        </Link>
      </div>
    );
  }

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

          <form action={startOutreach.bind(null, profile.userId)} className="space-y-3">
            <Field label="Message">
              <Textarea name="body" required maxLength={4000} placeholder="Hi! Your profile caught our eye because…" />
            </Field>

            <details className="rounded-lg border border-dashed border-black/15 p-3 dark:border-white/15" open>
              <summary className="cursor-pointer text-sm font-medium">Attach job offer (optional)</summary>
              <div className="mt-3 space-y-3">
                <Field label="Role title">
                  <Input name="offerTitle" maxLength={120} placeholder="Senior Fullstack Engineer" />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Salary min (SEK/mo)">
                    <Input name="salaryMin" type="number" min={0} placeholder="55000" />
                  </Field>
                  <Field label="Salary max (SEK/mo)">
                    <Input name="salaryMax" type="number" min={0} placeholder="70000" />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Hours/week">
                    <Input name="hoursPerWeek" type="number" min={1} max={80} placeholder="40" />
                  </Field>
                  <Field label="Location">
                    <Input name="offerLocation" maxLength={120} placeholder="Stockholm (hybrid)" />
                  </Field>
                </div>
              </div>
            </details>

            <Button type="submit" className="w-full">Send message</Button>
          </form>
        </Card>
      </aside>
    </div>
  );
}
