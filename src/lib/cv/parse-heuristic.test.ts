import { describe, expect, it } from "vitest";
import { parseCvHeuristically } from "./parse-heuristic";

// Text as extractPdfText() returns it: one line per visual line of the PDF.
const ENGLISH_CV = `Anna Lindqvist
anna.lindqvist@example.com · 070-123 45 67 · Stockholm
Fullstack Developer

Summary
Fullstack developer with 5 years building SaaS products.

Experience
Fullstack Developer, Klarna 2022 – present
Checkout team. React/Node, event-driven services.
Frontend Developer at Tink 2020 – 2022
Built the account aggregation dashboard.

Education
MSc in Computer Science, KTH Royal Institute of Technology 2015 – 2020

Skills
React, TypeScript • Node.js | PostgreSQL

Certifications
AWS Solutions Architect Associate, Amazon Web Services 2023`;

const SWEDISH_CV = `Sofia Karlsson
Civilingenjörsstudent i maskinteknik
sofia.karlsson@example.se · 073-555 12 34

Profil
Nyfiken student med fokus på produktutveckling.

Arbetslivserfarenhet
Sommarpraktikant hos Saab 2025 – 2025
Konstruktion av fixturer i Creo.

Utbildning
Civilingenjör i Maskinteknik, Linköpings universitet 2021 – nuvarande
Högskoleingenjör i Elektroteknik, Jönköping University 2017 – 2020

Kompetenser
MATLAB, Creo, Python`;

describe("parseCvHeuristically — English CV", () => {
  const cv = parseCvHeuristically(ENGLISH_CV, { name: "Anna Lindqvist" });

  it("uses the job title as headline — not the candidate's name or contact line", () => {
    expect(cv.headline).toBe("Fullstack Developer");
  });

  it("takes the location from the contact line", () => {
    expect(cv.location).toBe("Stockholm");
  });

  it("reads the summary as bio", () => {
    expect(cv.bio).toBe("Fullstack developer with 5 years building SaaS products.");
  });

  it("splits skills on commas, bullets and pipes", () => {
    expect(cv.skills).toEqual(["React", "TypeScript", "Node.js", "PostgreSQL"]);
  });

  it("finds each role with company, years and description", () => {
    expect(cv.experiences).toEqual([
      {
        title: "Fullstack Developer",
        company: "Klarna",
        startYear: 2022,
        startMonth: null,
        endYear: null,
        endMonth: null,
        isCurrent: true,
        description: "Checkout team. React/Node, event-driven services.",
      },
      {
        title: "Frontend Developer",
        company: "Tink",
        startYear: 2020,
        startMonth: null,
        endYear: 2022,
        endMonth: null,
        isCurrent: false,
        description: "Built the account aggregation dashboard.",
      },
    ]);
  });

  it("finds education with degree, field and school", () => {
    expect(cv.educations).toEqual([
      { school: "KTH Royal Institute of Technology", degree: "MSc", field: "Computer Science", startYear: 2015, endYear: 2020 },
    ]);
  });

  it("finds certifications with issuer and year", () => {
    expect(cv.certifications).toEqual([
      { name: "AWS Solutions Architect Associate", issuer: "Amazon Web Services", year: 2023 },
    ]);
  });
});

describe("parseCvHeuristically — Swedish CV", () => {
  const cv = parseCvHeuristically(SWEDISH_CV, { name: "Sofia Karlsson" });

  it("picks the title line as headline", () => {
    expect(cv.headline).toBe("Civilingenjörsstudent i maskinteknik");
    expect(cv.location).toBeNull(); // contact line has no place name
  });

  it("tolerates a middle name and a 'CV' title line", () => {
    const withMiddle = parseCvHeuristically("CV\nSofia Maria Karlsson\nData Analyst", { name: "Sofia Karlsson" });
    expect(withMiddle.headline).toBe("Data Analyst");
  });

  it("understands Swedish sections and 'hos'", () => {
    expect(cv.bio).toBe("Nyfiken student med fokus på produktutveckling.");
    expect(cv.skills).toEqual(["MATLAB", "Creo", "Python"]);
    expect(cv.experiences).toMatchObject([
      { title: "Sommarpraktikant", company: "Saab", startYear: 2025, endYear: 2025, isCurrent: false },
    ]);
  });

  it("recognises Swedish engineering degrees", () => {
    expect(cv.educations).toEqual([
      { school: "Linköpings universitet", degree: "Civilingenjör", field: "Maskinteknik", startYear: 2021, endYear: null },
      { school: "Jönköping University", degree: "Högskoleingenjör", field: "Elektroteknik", startYear: 2017, endYear: 2020 },
    ]);
  });
});

describe("parseCvHeuristically — edge cases", () => {
  it("returns an empty draft for text without recognisable sections", () => {
    const cv = parseCvHeuristically("just some words\nwithout structure");
    expect(cv.experiences).toEqual([]);
    expect(cv.educations).toEqual([]);
    expect(cv.skills).toEqual([]);
  });

  it("still picks a headline when no name is known", () => {
    expect(parseCvHeuristically("Data Engineer\nfoo@bar.se").headline).toBe("Data Engineer");
  });
});
