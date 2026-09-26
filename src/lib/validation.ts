import { z } from "zod";

/**
 * Zod schemas for server-action input. They live here (not in the
 * "use server" files, which may only export async functions) so they can
 * be unit-tested directly.
 */

/** Links shown to other users must be http(s) — never javascript:, data: etc. */
export const httpUrl = z.url({ protocol: /^https?$/, error: "Use an http(s) link" });

/** Render guard for URLs already stored before validation was tightened. */
export function isHttpUrl(value: string | null | undefined): value is string {
  return !!value && httpUrl.safeParse(value).success;
}

// ---------- Candidate profile ----------

export const basicsSchema = z.object({
  headline: z.string().trim().max(120),
  location: z.string().trim().max(80),
  bio: z.string().trim().max(2000),
  skills: z.string().trim().max(500),
});

const isoDate = z.iso.date();

export const experienceSchema = z
  .object({
    title: z.string().trim().min(1).max(100),
    company: z.string().trim().min(1).max(100),
    startDate: isoDate,
    endDate: z.union([isoDate, z.literal("")]).optional(),
    description: z.string().trim().max(1000).optional(),
  })
  .refine((d) => !d.endDate || d.endDate >= d.startDate, {
    message: "End date can't be before the start date",
    path: ["endDate"],
  });

const year = z.coerce.number().int().min(1950).max(2100);

export const educationSchema = z
  .object({
    school: z.string().trim().min(1).max(120),
    degree: z.string().trim().min(1).max(80),
    field: z.string().trim().min(1).max(120),
    startYear: year,
    endYear: z.union([year, z.literal("")]).optional(),
  })
  .refine((d) => typeof d.endYear !== "number" || d.endYear >= d.startYear, {
    message: "End year can't be before the start year",
    path: ["endYear"],
  });

export const projectSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(1000).optional(),
  url: z.union([httpUrl, z.literal("")]).optional(),
});

export const certificationSchema = z.object({
  name: z.string().trim().min(1).max(120),
  issuer: z.string().trim().min(1).max(120),
  year,
});

// ---------- Company outreach ----------

const optionalInt = <T extends z.ZodType>(schema: T) => z.union([schema, z.literal("")]).optional();
const blank = (value: unknown) => value === undefined || value === "";

export const outreachSchema = z
  .object({
    body: z.string().trim().min(1, "Write a message").max(4000),
    offerTitle: z.string().trim().max(120).optional(),
    salaryMin: optionalInt(z.coerce.number().int().positive()),
    salaryMax: optionalInt(z.coerce.number().int().positive()),
    hoursPerWeek: optionalInt(z.coerce.number().int().min(1).max(80)),
    offerLocation: z.string().trim().max(120).optional(),
  })
  .refine(
    (d) => typeof d.salaryMin !== "number" || typeof d.salaryMax !== "number" || d.salaryMin <= d.salaryMax,
    { message: "Minimum salary can't be above the maximum", path: ["salaryMax"] },
  )
  // Offer details without a title used to be dropped silently.
  .refine(
    (d) => !!d.offerTitle || [d.salaryMin, d.salaryMax, d.hoursPerWeek, d.offerLocation].every(blank),
    { message: "Give the offer a role title — or clear the offer fields", path: ["offerTitle"] },
  );
