import { describe, expect, it } from "vitest";
import {
  educationSchema,
  experienceSchema,
  isHttpUrl,
  outreachSchema,
  projectSchema,
} from "./validation";

describe("project links", () => {
  it.each(["javascript:alert(1)", "JaVaScRiPt:alert(1)", "data:text/html,<script>alert(1)</script>", "ftp://files.example"])(
    "rejects %s",
    (url) => {
      expect(projectSchema.safeParse({ name: "P", url }).success).toBe(false);
      expect(isHttpUrl(url)).toBe(false);
    },
  );

  it("accepts http(s) and an empty field", () => {
    expect(projectSchema.safeParse({ name: "P", url: "https://github.com/x/y" }).success).toBe(true);
    expect(projectSchema.safeParse({ name: "P", url: "" }).success).toBe(true);
    expect(isHttpUrl("http://example.se")).toBe(true);
    expect(isHttpUrl(null)).toBe(false);
  });
});

describe("experience dates", () => {
  const base = { title: "Dev", company: "Acme", startDate: "2022-03-01" };

  it("accepts an open-ended or later end date", () => {
    expect(experienceSchema.safeParse({ ...base, endDate: "" }).success).toBe(true);
    expect(experienceSchema.safeParse({ ...base, endDate: "2024-01-31" }).success).toBe(true);
  });

  it("rejects invalid dates and an end before the start", () => {
    expect(experienceSchema.safeParse({ ...base, startDate: "yesterday" }).success).toBe(false);
    expect(experienceSchema.safeParse({ ...base, startDate: "2022-02-31" }).success).toBe(false);
    expect(experienceSchema.safeParse({ ...base, endDate: "2021-12-31" }).success).toBe(false);
  });

  it("rejects an education that ends before it starts", () => {
    const edu = { school: "LiU", degree: "MSc", field: "Mechanical Engineering", startYear: "2021" };
    expect(educationSchema.safeParse({ ...edu, endYear: "2026" }).success).toBe(true);
    expect(educationSchema.safeParse({ ...edu, endYear: "2019" }).success).toBe(false);
  });
});

describe("outreach offers", () => {
  const msg = { body: "Hi Anna!" };

  it("accepts a plain message and a full offer", () => {
    expect(outreachSchema.safeParse(msg).success).toBe(true);
    expect(
      outreachSchema.safeParse({ ...msg, offerTitle: "Engineer", salaryMin: "55000", salaryMax: "70000", hoursPerWeek: "40", offerLocation: "Remote" })
        .success,
    ).toBe(true);
  });

  it("rejects a salary range that's upside down", () => {
    const r = outreachSchema.safeParse({ ...msg, offerTitle: "Engineer", salaryMin: "80000", salaryMax: "60000" });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toMatch(/Minimum salary/);
  });

  it("rejects offer details without a role title instead of dropping them", () => {
    const r = outreachSchema.safeParse({ ...msg, offerTitle: "", salaryMin: "55000", salaryMax: "", hoursPerWeek: "", offerLocation: "" });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toMatch(/role title/);
  });
});
