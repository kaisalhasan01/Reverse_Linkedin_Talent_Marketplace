import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { fullProfileInclude } from "@/components/profile/profile-display";

export type CandidateSearchParams = {
  q?: string;
  skill?: string;
  location?: string;
};

/**
 * Company-facing candidate search. Only profiles marked LOOKING are ever
 * returned — being "Employed" hides you from companies by design.
 *
 * Free-text queries use Postgres full-text search (websearch_to_tsquery, so
 * `react "design systems" -java` style input works) ranked with ts_rank over
 * headline + bio + skills + location + name. Skill and location are exact-ish
 * filters on top.
 */
export async function searchCandidates({ q, skill, location }: CandidateSearchParams) {
  // The searchable document. Kept as a composable fragment so the WHERE match
  // and the ts_rank ordering are guaranteed to use the same definition.
  const doc = Prisma.sql`to_tsvector('english',
    coalesce(p."headline", '') || ' ' ||
    coalesce(p."bio", '') || ' ' ||
    array_to_string(p."skills", ' ') || ' ' ||
    coalesce(p."location", '') || ' ' ||
    u."name"
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

  const rank = term
    ? Prisma.sql`ts_rank(${doc}, websearch_to_tsquery('english', ${term}))`
    : Prisma.sql`0`;

  const rows = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
    SELECT p."id"
    FROM "CandidateProfile" p
    JOIN "User" u ON u."id" = p."userId"
    WHERE ${Prisma.join(conditions, " AND ")}
    ORDER BY ${rank} DESC, p."updatedAt" DESC
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
