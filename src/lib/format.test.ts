import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { daysAgo, formatSalaryRange, timeAgo } from "./format";

// sv-SE groups thousands with a (narrow) no-break space — normalise for readable asserts.
const plain = (s: string | null) => s?.replace(/\s/g, " ") ?? null;

describe("formatSalaryRange", () => {
  it("formats ranges, open ends and nothing", () => {
    expect(plain(formatSalaryRange(62000, 72000))).toBe("62 000–72 000 SEK/month");
    expect(plain(formatSalaryRange(50000, null))).toBe("From 50 000 SEK/month");
    expect(plain(formatSalaryRange(null, 45000, "EUR"))).toBe("Up to 45 000 EUR/month");
    expect(formatSalaryRange(null, null)).toBeNull();
  });
});

describe("timeAgo / daysAgo", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-26T12:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  it("counts back in the largest sensible unit", () => {
    const ago = (ms: number) => timeAgo(new Date(Date.now() - ms));
    expect(ago(30_000)).toBe("just now");
    expect(ago(5 * 60_000)).toBe("5m ago");
    expect(ago(3 * 3_600_000)).toBe("3h ago");
    expect(ago(2 * 86_400_000)).toBe("2d ago");
    expect(ago(10 * 86_400_000)).toBe("16 Sept 2026");
  });

  it("daysAgo returns the start of a window", () => {
    expect(daysAgo(7).toISOString()).toBe("2026-09-19T12:00:00.000Z");
  });
});
