"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCandidate } from "@/lib/session";

const PROFILE_PATH = "/candidate/profile";

async function myProfileId() {
  const user = await requireCandidate();
  const profile = await prisma.candidateProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!profile) throw new Error("Profile missing");
  return profile.id;
}

// ---------- Basics & status ----------

const basicsSchema = z.object({
  headline: z.string().trim().max(120),
  location: z.string().trim().max(80),
  bio: z.string().trim().max(2000),
  skills: z.string().trim().max(500),
});

export async function updateBasics(formData: FormData) {
  const profileId = await myProfileId();
  const parsed = basicsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  const skills = parsed.data.skills
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20);

  await prisma.candidateProfile.update({
    where: { id: profileId },
    data: {
      headline: parsed.data.headline,
      location: parsed.data.location,
      bio: parsed.data.bio,
      skills,
      openToRemote: formData.get("openToRemote") === "1",
    },
  });
  revalidatePath(PROFILE_PATH, "layout"); // badge in the shell shows status/identity
}

export async function toggleStatus() {
  const profileId = await myProfileId();
  const profile = await prisma.candidateProfile.findUniqueOrThrow({
    where: { id: profileId },
    select: { status: true },
  });
  await prisma.candidateProfile.update({
    where: { id: profileId },
    data: { status: profile.status === "LOOKING" ? "EMPLOYED" : "LOOKING" },
  });
  revalidatePath(PROFILE_PATH, "layout");
}

// ---------- Experience ----------

const experienceSchema = z.object({
  title: z.string().trim().min(1).max(100),
  company: z.string().trim().min(1).max(100),
  startDate: z.string().min(1),
  endDate: z.string().optional(),
  description: z.string().trim().max(1000).optional(),
});

export async function addExperience(formData: FormData) {
  const profileId = await myProfileId();
  const parsed = experienceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  await prisma.experience.create({
    data: {
      profileId,
      title: parsed.data.title,
      company: parsed.data.company,
      startDate: new Date(parsed.data.startDate),
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
      description: parsed.data.description ?? "",
    },
  });
  revalidatePath(PROFILE_PATH);
}

export async function deleteExperience(id: string) {
  const profileId = await myProfileId();
  // deleteMany so the ownership condition is part of the query itself
  await prisma.experience.deleteMany({ where: { id, profileId } });
  revalidatePath(PROFILE_PATH);
}

// ---------- Education ----------

const educationSchema = z.object({
  school: z.string().trim().min(1).max(120),
  degree: z.string().trim().min(1).max(80),
  field: z.string().trim().min(1).max(120),
  startYear: z.coerce.number().int().min(1950).max(2100),
  endYear: z.union([z.coerce.number().int().min(1950).max(2100), z.literal("")]).optional(),
});

export async function addEducation(formData: FormData) {
  const profileId = await myProfileId();
  const parsed = educationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  await prisma.education.create({
    data: {
      profileId,
      school: parsed.data.school,
      degree: parsed.data.degree,
      field: parsed.data.field,
      startYear: parsed.data.startYear,
      endYear: typeof parsed.data.endYear === "number" ? parsed.data.endYear : null,
    },
  });
  revalidatePath(PROFILE_PATH);
}

export async function deleteEducation(id: string) {
  const profileId = await myProfileId();
  await prisma.education.deleteMany({ where: { id, profileId } });
  revalidatePath(PROFILE_PATH);
}

// ---------- Projects ----------

const projectSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(1000).optional(),
  url: z.union([z.url(), z.literal("")]).optional(),
});

export async function addProject(formData: FormData) {
  const profileId = await myProfileId();
  const parsed = projectSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  await prisma.project.create({
    data: {
      profileId,
      name: parsed.data.name,
      description: parsed.data.description ?? "",
      url: parsed.data.url || null,
    },
  });
  revalidatePath(PROFILE_PATH);
}

export async function deleteProject(id: string) {
  const profileId = await myProfileId();
  await prisma.project.deleteMany({ where: { id, profileId } });
  revalidatePath(PROFILE_PATH);
}

// ---------- Certifications ----------

const certificationSchema = z.object({
  name: z.string().trim().min(1).max(120),
  issuer: z.string().trim().min(1).max(120),
  year: z.coerce.number().int().min(1950).max(2100),
});

export async function addCertification(formData: FormData) {
  const profileId = await myProfileId();
  const parsed = certificationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  await prisma.certification.create({ data: { profileId, ...parsed.data } });
  revalidatePath(PROFILE_PATH);
}

export async function deleteCertification(id: string) {
  const profileId = await myProfileId();
  await prisma.certification.deleteMany({ where: { id, profileId } });
  revalidatePath(PROFILE_PATH);
}
