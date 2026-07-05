import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { fullProfileInclude } from "@/components/profile/profile-display";

export type CandidateSearchParams = {
  q?: string;
  skill?: string;
  location?: string;
  university?: string;
  employer?: string;
  minYears?: string; // raw from the query string; validated below
  remote?: string; // "1" when the checkbox is on
};

/**
 * Company-facing candidate search. Only profiles marked LOOKING are ever
 * returned — being "Employed" hides you from companies by design.
 *
 * Deliberately compliant: there are no filters for gender, age or other
 * protected attributes (diskrimineringslagen 2008:567) — we don't even
 * collect those fields. Filters cover merit only: skills, location,
 * education, employers, experience and remote availability.
 *
 * Free-text queries use Postgres full-text search (websearch_to_tsquery, so
 * `react "design systems" -java` style input works) ranked with ts_rank.
 * The document covers the profile plus work history and education.
 */
export async function searchCandidates(params: CandidateSearchParams) {
  const { q, skill, location, university, employer, minYears, remote } = params;

  // The searchable document. Kept as a composable fragment so the WHERE match
  // and the ts_rank ordering are guaranteed to use the same definition.
  const doc = Prisma.sql`to_tsvector('english',
    coalesce(p."headline", '') || ' ' ||
    coalesce(p."bio", '') || ' ' ||
    array_to_string(p."skills", ' ') || ' ' ||
    coalesce(p."location", '') || ' ' ||
    u."name" || ' ' ||
    coalesce((SELECT string_agg(e."title" || ' ' || e."company" || ' ' || e."description", ' ')
              FROM "Experience" e WHERE e."profileId" = p."id"), '') || ' ' ||
    coalesce((SELECT string_agg(ed."school" || ' ' || ed."degree" || ' ' || ed."field", ' ')
              FROM "Education" ed WHERE ed."profileId" = p."id"), '')
  )`;

  const conditions: Prisma.Sql[] = [Prisma.sql`p."status" = 'LOOKING'`];

  const term = q?.trim();
  if (term) {
    conditions.push(Prisma.sql`${doc} @@ websearch_to_tsquery('english', ${term})`);
  }
  const skillTerm = skill?.trim();
  if (skillTerm) {
    conditions.push(
      Prisma.sql`EXISTS (SELECT 1 FROM unnest(p."skills") AS s WHERE s ILIKE ${skillTerm})`,
    );
  }
  const locationTerm = location?.trim();
  if (locationTerm) {
    conditions.push(Prisma.sql`p."location" ILIKE ${"%" + locationTerm + "%"}`);
  }
  const universityTerm = university?.trim();
  if (universityTerm) {
    conditions.push(Prisma.sql`EXISTS (
      SELECT 1 FROM "Education" ed
      WHERE ed."profileId" = p."id" AND ed."school" ILIKE ${"%" + universityTerm + "%"}
    )`);
  }
  const employerTerm = employer?.trim();
  if (employerTerm) {
    conditions.push(Prisma.sql`EXISTS (
      SELECT 1 FROM "Experience" e
      WHERE e."profileId" = p."id" AND e."company" ILIKE ${"%" + employerTerm + "%"}
    )`);
  }
  const years = Number(minYears);
  if (Number.isFinite(years) && years > 0) {
    // Total professional experience in years. Overlapping engagements
    // double-count — acceptable precision for a search filter.
    conditions.push(Prisma.sql`(
      SELECT coalesce(SUM(EXTRACT(EPOCH FROM (coalesce(e."endDate", now()) - e."startDate"))), 0)
      FROM "Experience" e WHERE e."profileId" = p."id"
    ) / 31557600.0 >= ${years}`);
  }
  if (remote === "1") {
    conditions.push(Prisma.sql`p."openToRemote" = true`);
  }

  // NB: a bare integer constant in ORDER BY is read as a column ordinal by
  // Postgres, so the no-query case must drop the rank expression entirely.
  const orderBy = term
    ? Prisma.sql`ts_rank(${doc}, websearch_to_tsquery('english', ${term})) DESC, p."updatedAt" DESC`
    : Prisma.sql`p."updatedAt" DESC`;

  const rows = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
    SELECT p."id"
    FROM "CandidateProfile" p
    JOIN "User" u ON u."id" = p."userId"
    WHERE ${Prisma.join(conditions, " AND ")}
    ORDER BY ${orderBy}
    LIMIT 30
  `);
  const ids = rows.map((r) => r.id);
  if (ids.length === 0) return [];

  // Hydrate through Prisma for typed relations, then restore rank order.
  const profiles = await prisma.candidateProfile.findMany({
    where: { id: { in: ids } },
    include: { ...fullProfileInclude, user: { select: { id: true, name: true } } },
  });
  const order = new Map(ids.map((id, i) => [id, i]));
  return profiles.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}
