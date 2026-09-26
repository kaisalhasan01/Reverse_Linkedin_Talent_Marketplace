import { describe, expect, it } from "vitest";
import { companyAccess, trialEndDate } from "./billing";

const now = new Date("2026-09-26T12:00:00Z");
const inDays = (d: number) => new Date(now.getTime() + d * 24 * 3600 * 1000);

describe("companyAccess", () => {
  it("an active subscription has access", () => {
    expect(companyAccess({ subscriptionStatus: "ACTIVE", trialEndsAt: null }, now)).toEqual({
      allowed: true,
      trialDaysLeft: null,
    });
  });

  it("a running trial has access and counts the days left", () => {
    expect(companyAccess({ subscriptionStatus: "TRIALING", trialEndsAt: inDays(10) }, now)).toEqual({
      allowed: true,
      trialDaysLeft: 10,
    });
    expect(companyAccess({ subscriptionStatus: "TRIALING", trialEndsAt: inDays(0.2) }, now)).toMatchObject({
      trialDaysLeft: 1,
    });
  });

  it("an ended or open-ended trial has no access (fail closed)", () => {
    expect(companyAccess({ subscriptionStatus: "TRIALING", trialEndsAt: inDays(-1) }, now)).toEqual({
      allowed: false,
      reason: "trial_ended",
    });
    expect(companyAccess({ subscriptionStatus: "TRIALING", trialEndsAt: null }, now)).toMatchObject({
      allowed: false,
    });
  });

  it("a canceled subscription has no access, even with trial days left", () => {
    expect(companyAccess({ subscriptionStatus: "CANCELED", trialEndsAt: inDays(5) }, now)).toEqual({
      allowed: false,
      reason: "canceled",
    });
  });

  it("new trials last 14 days", () => {
    expect(trialEndDate(now).toISOString()).toBe("2026-10-10T12:00:00.000Z");
  });
});
