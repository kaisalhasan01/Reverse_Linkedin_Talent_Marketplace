import Link from "next/link";
import { requireCompany } from "@/lib/session";
import { searchCandidates } from "@/lib/search";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; skill?: string; location?: string }>;
}) {
  await requireCompany();
  const { q, skill, location } = await searchParams;
  const hasQuery = Boolean(q || skill || location);
  const results = await searchCandidates({ q, skill, location });

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-6 py-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Search candidates</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Everyone below is marked <Badge tone="green">Looking for work</Badge> right now.
        </p>
      </div>

      {/* GET form — the URL is the state, results are shareable */}
      <Card>
        <form method="get" className="grid gap-3 sm:grid-cols-[1fr_180px_180px_auto]">
          <Input
            name="q"
            defaultValue={q}
            placeholder={'Try: react postgres, "design systems", ml -consulting'}
          />
          <Input name="skill" defaultValue={skill} placeholder="Skill, e.g. React" />
          <Input name="location" defaultValue={location} placeholder="Location" />
          <Button type="submit">Search</Button>
        </form>
      </Card>

      <div className="space-y-3">
        <p className="text-sm text-zinc-500">
          {results.length} candidate{results.length === 1 ? "" : "s"}
          {hasQuery ? " matching your search" : " available"}
        </p>

        {results.map((p) => (
          <Card key={p.id} className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <Avatar name={p.user.name} />
              <div className="min-w-0">
                <p className="text-sm font-semibold">{p.user.name}</p>
                {p.headline ? <p className="text-sm text-zinc-600 dark:text-zinc-300">{p.headline}</p> : null}
                <p className="mt-0.5 text-xs text-zinc-500">{p.location}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {p.skills.slice(0, 6).map((s) => (
                    <Badge key={s}>{s}</Badge>
                  ))}
                </div>
              </div>
            </div>
            <Link href={`/company/candidates/${p.id}`} className="shrink-0">
              <Button variant="outline" size="sm">View profile</Button>
            </Link>
          </Card>
        ))}

        {results.length === 0 ? (
          <Card className="py-10 text-center text-sm text-zinc-500">
            No candidates match. Try fewer filters or a broader query.
          </Card>
        ) : null}
      </div>
    </div>
  );
}
