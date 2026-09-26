import type { Prisma } from "@prisma/client";
import type { ReactNode } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { monthYear } from "@/lib/format";
import { isHttpUrl } from "@/lib/validation";

/** Profile with everything loaded — matches the include below via Prisma's generated types. */
export type FullProfile = Prisma.CandidateProfileGetPayload<{
  include: {
    experiences: true;
    educations: true;
    projects: true;
    certifications: true;
    user: { select: { name: true } };
  };
}>;

export const fullProfileInclude = {
  experiences: { orderBy: { startDate: "desc" as const } },
  educations: { orderBy: { startYear: "desc" as const } },
  projects: true,
  certifications: { orderBy: { year: "desc" as const } },
  user: { select: { name: true } },
};

type ItemKind = "experience" | "education" | "project" | "certification";

/**
 * Renders a full candidate profile. Used in two places:
 *  - the candidate's own /candidate/profile (with edit affordances injected)
 *  - the company's candidate detail view (read-only)
 *
 * `itemAction` renders a per-item control (e.g. Remove) and `sectionExtras`
 * appends content (e.g. an add-form) inside each section card.
 */
export function ProfileDisplay({
  profile,
  headerExtra,
  itemAction,
  sectionExtras,
}: {
  profile: FullProfile;
  headerExtra?: ReactNode;
  itemAction?: (kind: ItemKind, id: string) => ReactNode;
  sectionExtras?: Partial<Record<ItemKind, ReactNode>>;
}) {
  const looking = profile.status === "LOOKING";

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Avatar name={profile.user.name} size="lg" />
            <div>
              <h1 className="text-xl font-semibold tracking-tight">{profile.user.name}</h1>
              {profile.headline ? <p className="text-sm text-zinc-600 dark:text-zinc-300">{profile.headline}</p> : null}
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                {profile.location ? <span>{profile.location}</span> : null}
                <Badge tone={looking ? "green" : "neutral"}>
                  {looking ? "Looking for work" : "Employed"}
                </Badge>
                {profile.openToRemote ? <Badge tone="blue">Open to remote</Badge> : null}
              </div>
            </div>
          </div>
          {headerExtra}
        </div>

        {profile.skills.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {profile.skills.map((skill) => (
              <Badge key={skill}>{skill}</Badge>
            ))}
          </div>
        ) : null}

        {profile.bio ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            {profile.bio}
          </p>
        ) : null}
      </Card>

      {/* Experience */}
      <Section title="Experience" extra={sectionExtras?.experience}>
        {profile.experiences.map((e) => (
          <Item
            key={e.id}
            title={`${e.title} · ${e.company}`}
            meta={`${monthYear(e.startDate)} — ${e.endDate ? monthYear(e.endDate) : "present"}`}
            body={e.description}
            action={itemAction?.("experience", e.id)}
          />
        ))}
        {profile.experiences.length === 0 ? <Empty label="No experience added yet." /> : null}
      </Section>

      {/* Education */}
      <Section title="Education" extra={sectionExtras?.education}>
        {profile.educations.map((e) => (
          <Item
            key={e.id}
            title={`${e.degree} in ${e.field}`}
            meta={`${e.school} · ${e.startYear}–${e.endYear ?? "ongoing"}`}
            action={itemAction?.("education", e.id)}
          />
        ))}
        {profile.educations.length === 0 ? <Empty label="No education added yet." /> : null}
      </Section>

      {/* Projects */}
      <Section title="Projects" extra={sectionExtras?.project}>
        {profile.projects.map((p) => (
          <Item
            key={p.id}
            title={p.name}
            meta={p.url ?? undefined}
            metaHref={isHttpUrl(p.url) ? p.url : undefined}
            body={p.description}
            action={itemAction?.("project", p.id)}
          />
        ))}
        {profile.projects.length === 0 ? <Empty label="No projects added yet." /> : null}
      </Section>

      {/* Certifications */}
      <Section title="Certifications" extra={sectionExtras?.certification}>
        {profile.certifications.map((c) => (
          <Item
            key={c.id}
            title={c.name}
            meta={`${c.issuer} · ${c.year}`}
            action={itemAction?.("certification", c.id)}
          />
        ))}
        {profile.certifications.length === 0 ? <Empty label="No certifications added yet." /> : null}
      </Section>
    </div>
  );
}

function Section({ title, extra, children }: { title: string; extra?: ReactNode; children: ReactNode }) {
  return (
    <Card>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">{title}</h2>
      <div className="mt-3 space-y-4">{children}</div>
      {extra ? <div className="mt-4 border-t border-black/5 pt-4 dark:border-white/10">{extra}</div> : null}
    </Card>
  );
}

function Item({
  title,
  meta,
  metaHref,
  body,
  action,
}: {
  title: string;
  meta?: string;
  metaHref?: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        {meta ? (
          metaHref ? (
            <a href={metaHref} target="_blank" rel="noreferrer" className="text-xs text-sky-700 underline dark:text-sky-400">
              {meta}
            </a>
          ) : (
            <p className="text-xs text-zinc-500">{meta}</p>
          )
        ) : null}
        {body ? <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{body}</p> : null}
      </div>
      {action}
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return <p className="text-sm text-zinc-400">{label}</p>;
}
