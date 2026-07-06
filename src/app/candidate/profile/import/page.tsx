import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireCandidate } from "@/lib/session";
import { importDraftPayloadSchema } from "@/lib/cv";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CvUploadForm } from "@/components/cv/upload-form";
import { applyImport, discardImport } from "./actions";

export default async function CvImportPage() {
  const user = await requireCandidate();
  const draft = await prisma.importDraft.findUnique({ where: { userId: user.id } });
  const payload = draft ? importDraftPayloadSchema.safeParse(draft.payload) : null;

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-8">
      <Link href="/candidate/profile" className="text-sm text-zinc-500 hover:text-foreground">
        ← Back to profile
      </Link>
      <h1 className="mt-4 text-xl font-semibold tracking-tight">Import from CV</h1>

      {!payload?.success ? (
        <>
          <p className="mt-2 text-sm text-zinc-500">
            Skip the typing — upload your CV and we&apos;ll prefill experience, education, skills
            and more. You review everything before it touches your profile.
          </p>
          <Card className="mt-6">
            <CvUploadForm />
          </Card>
        </>
      ) : (
        <ReviewDraft payload={payload.data} />
      )}
    </div>
  );
}

function ReviewDraft({
  payload,
}: {
  payload: import("@/lib/cv").ImportDraftPayload;
}) {
  const { cv, engine } = payload;
  const hasBasics = Boolean(cv.headline || cv.bio || cv.location || cv.skills.length);

  return (
    <div className="mt-2 space-y-5">
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <span>Here&apos;s what we found — untick anything you don&apos;t want.</span>
        <Badge tone={engine === "claude" ? "blue" : "neutral"}>
          {engine === "claude" ? "AI-parsed" : "Parsed locally"}
        </Badge>
      </div>

      <form action={applyImport} className="space-y-5">
        {hasBasics ? (
          <Card>
            <CheckboxRow name="basics" title="Profile basics">
              <ul className="mt-2 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                {cv.headline ? <li><span className="font-medium text-foreground">Headline:</span> {cv.headline}</li> : null}
                {cv.location ? <li><span className="font-medium text-foreground">Location:</span> {cv.location}</li> : null}
                {cv.skills.length ? <li><span className="font-medium text-foreground">Skills:</span> {cv.skills.join(", ")}</li> : null}
                {cv.bio ? <li><span className="font-medium text-foreground">About:</span> {cv.bio.slice(0, 220)}{cv.bio.length > 220 ? "…" : ""}</li> : null}
              </ul>
            </CheckboxRow>
          </Card>
        ) : null}

        <Section title={`Experience (${cv.experiences.length})`}>
          {cv.experiences.map((exp, i) => (
            <CheckboxRow
              key={i}
              name={`exp-${i}`}
              disabled={exp.startYear === null}
              title={`${exp.title} · ${exp.company}`}
              meta={
                exp.startYear === null
                  ? "No start date found — add manually instead"
                  : `${exp.startYear} — ${exp.isCurrent ? "present" : exp.endYear ?? "?"}`
              }
            >
              {exp.description ? (
                <p className="mt-1 text-sm text-zinc-500">{exp.description.slice(0, 180)}</p>
              ) : null}
            </CheckboxRow>
          ))}
        </Section>

        <Section title={`Education (${cv.educations.length})`}>
          {cv.educations.map((edu, i) => (
            <CheckboxRow
              key={i}
              name={`edu-${i}`}
              disabled={edu.startYear === null}
              title={`${edu.degree} in ${edu.field}`}
              meta={
                edu.startYear === null
                  ? `${edu.school} — no year found, add manually instead`
                  : `${edu.school} · ${edu.startYear}–${edu.endYear ?? "ongoing"}`
              }
            />
          ))}
        </Section>

        <Section title={`Certifications (${cv.certifications.length})`}>
          {cv.certifications.map((cert, i) => (
            <CheckboxRow
              key={i}
              name={`cert-${i}`}
              disabled={cert.year === null}
              title={cert.name}
              meta={
                cert.year === null
                  ? "No year found — add manually instead"
                  : `${cert.issuer ?? "Unknown issuer"} · ${cert.year}`
              }
            />
          ))}
        </Section>

        <div className="flex gap-3">
          <Button type="submit" className="flex-1">Add selected to my profile</Button>
        </div>
      </form>

      <form action={discardImport}>
        <Button type="submit" variant="outline" className="w-full">
          Discard — delete the parsed draft
        </Button>
      </form>

      <p className="text-xs text-zinc-400">
        The parsed draft is deleted as soon as you apply or discard it. Uploading a new CV
        replaces it.
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">{title}</h2>
      <div className="mt-3 space-y-4">
        {Array.isArray(children) && children.length === 0 ? (
          <p className="text-sm text-zinc-400">Nothing found in this section.</p>
        ) : (
          children
        )}
      </div>
    </Card>
  );
}

function CheckboxRow({
  name,
  title,
  meta,
  disabled,
  children,
}: {
  name: string;
  title: string;
  meta?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <label className={`flex items-start gap-3 ${disabled ? "opacity-50" : "cursor-pointer"}`}>
      <input type="checkbox" name={name} defaultChecked={!disabled} disabled={disabled} className="mt-1" />
      <span className="min-w-0">
        <span className="block text-sm font-medium">{title}</span>
        {meta ? <span className="block text-xs text-zinc-500">{meta}</span> : null}
        {children}
      </span>
    </label>
  );
}
