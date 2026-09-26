import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { searchCandidates, type CandidateSearchParams } from "@/lib/search";

// Demo seed: 9 LOOKING candidates, 3 EMPLOYED who must never reach companies.
const EMPLOYED = ["Lisa Öberg", "Karl Axelsson", "Gustav Lund"];

async function names(params: CandidateSearchParams) {
  return (await searchCandidates(params)).map((p) => p.user.name);
}

/** Flip a seeded candidate's fields for one test, then restore them. */
async function withProfile(
  name: string,
  data: { status?: "LOOKING" | "EMPLOYED"; openToRemote?: boolean },
  fn: () => Promise<void>,
) {
  const profile = await prisma.candidateProfile.findFirstOrThrow({ where: { user: { name } } });
  await prisma.candidateProfile.update({ where: { id: profile.id }, data });
  try {
    await fn();
  } finally {
    await prisma.candidateProfile.update({
      where: { id: profile.id },
      data: { status: profile.status, openToRemote: profile.openToRemote },
    });
  }
}

afterAll(() => prisma.$disconnect());

describe("Employed = hidden (enforced in SQL)", () => {
  it("an empty search lists exactly the LOOKING candidates", async () => {
    const all = await names({});
    expect(all).toHaveLength(9);
    for (const n of EMPLOYED) expect(all).not.toContain(n);
  });

  it.each<[string, CandidateSearchParams]>([
    ["a query matching an employed profile", { q: "engineering manager" }],
    ["a query for an employed candidate's niche", { q: "unity multiplayer" }],
    ["the skill filter", { skill: "Security" }],
    ["the location filter", { location: "Skövde" }],
    ["the employer filter", { employer: "Ericsson" }],
  ])("never returns EMPLOYED candidates via %s", async (_label, params) => {
    const found = await names(params);
    for (const n of EMPLOYED) expect(found).not.toContain(n);
  });

  it("it is the status that hides them — the same query finds a LOOKING profile", async () => {
    await withProfile("Lisa Öberg", { status: "LOOKING" }, async () => {
      expect(await names({ q: "engineering manager" })).toContain("Lisa Öberg");
    });
    expect(await names({ q: "engineering manager" })).not.toContain("Lisa Öberg");
  });
});

describe("full-text search", () => {
  it("ranks Anna first for 'react postgres'", async () => {
    expect((await names({ q: "react postgres" }))[0]).toBe("Anna Lindqvist");
  });

  it("supports websearch syntax: exclusion with -term", async () => {
    const found = await names({ q: "react -postgres" });
    expect(found).toContain("Amina Hassan");
    expect(found).not.toContain("Anna Lindqvist");
  });

  it("searches work history and education, not just the headline", async () => {
    expect(await names({ q: "checkout" })).toContain("Anna Lindqvist"); // Klarna role description
    expect(await names({ q: "chalmers" })).toEqual(
      expect.arrayContaining(["Erik Johansson", "David Sjöberg"]),
    );
  });
});

describe("filters", () => {
  it("university and past employer", async () => {
    expect((await names({ university: "chalmers" })).sort()).toEqual(["David Sjöberg", "Erik Johansson"]);
    expect(await names({ employer: "spotify" })).toEqual(["Erik Johansson"]);
  });

  it("minimum years of experience matches the experience dates", async () => {
    const profiles = await prisma.candidateProfile.findMany({
      where: { status: "LOOKING" },
      include: { user: true, experiences: true },
    });
    const years = (p: (typeof profiles)[number]) =>
      p.experiences.reduce(
        (sum, e) => sum + ((e.endDate ?? new Date()).getTime() - e.startDate.getTime()) / 31_557_600_000,
        0,
      );
    for (const min of [3, 6, 8]) {
      const expected = profiles.filter((p) => years(p) >= min).map((p) => p.user.name).sort();
      expect((await names({ minYears: String(min) })).sort()).toEqual(expected);
    }
  });

  it("open to remote", async () => {
    await withProfile("Johan Berg", { openToRemote: false }, async () => {
      const remote = await names({ remote: "1" });
      expect(remote).not.toContain("Johan Berg");
      expect(remote).toHaveLength(8);
    });
  });

  it("treats LIKE wildcards in filter input literally", async () => {
    expect(await names({ skill: "%" })).toEqual([]);
    expect(await names({ location: "_" })).toEqual([]);
    expect(await names({ university: "%" })).toEqual([]);
  });

  it("ignores junk in minYears", async () => {
    expect(await names({ minYears: "abc" })).toHaveLength(9);
    expect(await names({ minYears: "-5" })).toHaveLength(9);
  });
});
