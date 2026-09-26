"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireCandidate } from "@/lib/session";
import { extractPdfText, importDraftPayloadSchema, parseCv } from "@/lib/cv";

const IMPORT_PATH = "/candidate/profile/import";

export type UploadState = { error?: string };

/** Step 1: upload PDF → extract text locally → parse → save draft for review. */
export async function uploadCv(_prev: UploadState, formData: FormData): Promise<UploadState> {
  const user = await requireCandidate();

  const file = formData.get("cv");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a PDF file first." };
  if (file.type !== "application/pdf") return { error: "Only PDF files are supported." };
  if (file.size > 5 * 1024 * 1024) return { error: "Max file size is 5 MB." };

  let text: string;
  try {
    text = await extractPdfText(Buffer.from(await file.arrayBuffer()));
  } catch {
    return { error: "Couldn't read that PDF — is the file damaged?" };
  }
  if (text.length < 50) {
    return { error: "No readable text in the PDF. Scanned image CVs aren't supported yet." };
  }

  // The name tells the local parser which header line is *not* a headline.
  const payload = await parseCv(text, { name: user.name ?? undefined });

  // One draft per user — a new upload replaces the previous draft.
  await prisma.importDraft.upsert({
    where: { userId: user.id },
    create: { userId: user.id, payload },
    update: { payload, createdAt: new Date() },
  });

  revalidatePath(IMPORT_PATH);
  return {};
}

/** Step 2: candidate approved — apply the selected items to the profile. */
export async function applyImport(formData: FormData) {
  const user = await requireCandidate();
  const [draft, profile] = await Promise.all([
    prisma.importDraft.findUnique({ where: { userId: user.id } }),
    prisma.candidateProfile.findUniqueOrThrow({ where: { userId: user.id } }),
  ]);
  if (!draft) redirect(IMPORT_PATH);

  const parsed = importDraftPayloadSchema.safeParse(draft.payload);
  if (!parsed.success) {
    await prisma.importDraft.delete({ where: { userId: user.id } });
    redirect(IMPORT_PATH);
  }
  const { cv } = parsed.data;
  const checked = (key: string) => formData.get(key) === "on";

  // Basics: only overwrite fields the CV actually filled; merge skills.
  if (checked("basics")) {
    await prisma.candidateProfile.update({
      where: { id: profile.id },
      data: {
        ...(cv.headline ? { headline: cv.headline.slice(0, 120) } : {}),
        ...(cv.bio ? { bio: cv.bio.slice(0, 2000) } : {}),
        ...(cv.location ? { location: cv.location.slice(0, 80) } : {}),
        skills: [...new Set([...profile.skills, ...cv.skills])].slice(0, 20),
      },
    });
  }

  for (const [i, exp] of cv.experiences.entries()) {
    if (!checked(`exp-${i}`) || exp.startYear === null) continue;
    await prisma.experience.create({
      data: {
        profileId: profile.id,
        title: exp.title.slice(0, 100),
        company: exp.company.slice(0, 100),
        startDate: new Date(exp.startYear, (exp.startMonth ?? 1) - 1, 1),
        endDate:
          exp.isCurrent || exp.endYear === null
            ? null
            : new Date(exp.endYear, (exp.endMonth ?? 1) - 1, 1),
        description: (exp.description ?? "").slice(0, 1000),
      },
    });
  }

  for (const [i, edu] of cv.educations.entries()) {
    if (!checked(`edu-${i}`) || edu.startYear === null) continue;
    await prisma.education.create({
      data: {
        profileId: profile.id,
        school: edu.school.slice(0, 120),
        degree: edu.degree.slice(0, 80),
        field: edu.field.slice(0, 120),
        startYear: edu.startYear,
        endYear: edu.endYear,
      },
    });
  }

  for (const [i, cert] of cv.certifications.entries()) {
    if (!checked(`cert-${i}`) || cert.year === null) continue;
    await prisma.certification.create({
      data: {
        profileId: profile.id,
        name: cert.name.slice(0, 120),
        issuer: (cert.issuer ?? "").slice(0, 120),
        year: cert.year,
      },
    });
  }

  // GDPR: the draft is deleted the moment it's applied.
  await prisma.importDraft.delete({ where: { userId: user.id } });
  redirect("/candidate/profile");
}

/** Candidate rejected the parse — delete the draft, nothing was saved. */
export async function discardImport() {
  const user = await requireCandidate();
  await prisma.importDraft.deleteMany({ where: { userId: user.id } });
  revalidatePath(IMPORT_PATH);
}
