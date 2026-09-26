import { z } from "zod";

/**
 * The shape a CV is parsed into, regardless of engine (Claude or the local
 * heuristic). Doubles as the structured-outputs schema for the Claude call,
 * so the API guarantees valid JSON in exactly this shape.
 *
 * Structured-outputs constraints: every field present (nullable rather than
 * optional), no unsupported string/number constraints.
 */
export const parsedCvSchema = z.object({
  headline: z.string().nullable(),
  bio: z.string().nullable(),
  location: z.string().nullable(),
  skills: z.array(z.string()),
  experiences: z.array(
    z.object({
      title: z.string(),
      company: z.string(),
      startYear: z.number().int().nullable(),
      startMonth: z.number().int().nullable(), // 1-12
      endYear: z.number().int().nullable(),
      endMonth: z.number().int().nullable(),
      isCurrent: z.boolean(),
      description: z.string().nullable(),
    }),
  ),
  educations: z.array(
    z.object({
      school: z.string(),
      degree: z.string(),
      field: z.string(),
      startYear: z.number().int().nullable(),
      endYear: z.number().int().nullable(),
    }),
  ),
  certifications: z.array(
    z.object({
      name: z.string(),
      issuer: z.string().nullable(),
      year: z.number().int().nullable(),
    }),
  ),
});

export type ParsedCv = z.infer<typeof parsedCvSchema>;

/** What we persist in ImportDraft.payload while the candidate reviews. */
export const importDraftPayloadSchema = z.object({
  engine: z.enum(["claude", "heuristic"]),
  cv: parsedCvSchema,
});

export type ImportDraftPayload = z.infer<typeof importDraftPayloadSchema>;

export const emptyParsedCv: ParsedCv = {
  headline: null,
  bio: null,
  location: null,
  skills: [],
  experiences: [],
  educations: [],
  certifications: [],
};
