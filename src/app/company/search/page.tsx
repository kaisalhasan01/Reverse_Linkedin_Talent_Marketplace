import Link from "next/link";
import { requireCompany } from "@/lib/session";
import { searchCandidates, type CandidateSearchParams } from "@/lib/search";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<CandidateSearchParams>;
}) {
  await requireCompany();
  const params = await searchParams;
  const { q, skill, location, university, employer, minYears, remote } = params;
  const hasQuery = Object.values(params).some((v) => v && String(v).trim());
  const moreFiltersActive = Boolean(university || employer || minYears || remote);
  const results = await searchCandidates(params);

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
        <form method="get" className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-[1fr_170px_170px_auto]">
            <Input
              name="q"
              defaultValue={q}
              placeholder={'Try: react postgres, "design systems", ml -consulting'}
            />
            <Input name="skill" defaultValue={skill} placeholder="Skill, e.g. React" />
            <Input name="location" defaultValue={location} placeholder="Location" />
            <Button type="submit">Search</Button>
          </div>

          <details open={moreFiltersActive}>
            <summary className="cursor-pointer text-sm font-medium text-sky-600 dark:text-sky-400">
              More filters
            </summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-4">
              <Field label="University / school">
                <Input name="university" defaultValue={university} placeholder="e.g. Chalmers" />
              </Field>
              <Field label="Past employer">
                <Input name="employer" defaultValue={employer} placeholder="e.g. Spotify" />
              </Field>
              <Field label="Min. years of experience">
                <Input name="minYears" type="number" min={0} max={50} defaultValue={minYears} placeholder="e.g. 3" />
              </Field>
              <Field label="Work arrangement">
                <label className="flex h-10 items-center gap-2 text-sm">
                  <input type="checkbox" name="remote" value="1" defaultChecked={remote === "1"} />
                  Open to remote
                </label>
              </Field>
            </div>
            <p className="mt-2 text-xs text-zinc-400">
              Filters cover merit only — Reverse never collects or filters on gender, age or
              other protected attributes.
            </p>
          </details>
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
                <p className="mt-0.5 text-xs text-zinc-500">
                  {[p.location, p.openToRemote ? "Open to remote" : null].filter(Boolean).join(" · ")}
                </p>
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
