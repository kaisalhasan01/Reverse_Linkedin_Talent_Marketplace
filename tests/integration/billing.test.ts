/** Paid access: search, profiles and outreach close when the trial ends. */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

type SessionUser = { id: string; role: "CANDIDATE" | "COMPANY"; name: string; email: string };
const session = vi.hoisted(() => ({ user: null as SessionUser | null }));

vi.mock("@/lib/session", () => {
  const redirect = () => {
    throw new Error("NEXT_REDIRECT");
  };
  return {
    requireUser: async () => session.user ?? redirect(),
    requireCandidate: async () => (session.user?.role === "CANDIDATE" ? session.user : redirect()),
    requireCompany: async () => (session.user?.role === "COMPANY" ? session.user : redirect()),
  };
});
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { prisma } from "@/lib/db";
import { requirePaidAccess } from "@/lib/paid-access";
import { startOutreach } from "@/app/company/candidates/[id]/actions";

const users: Record<string, SessionUser> = {};
let acme: { id: string; trialEndsAt: Date | null; subscriptionStatus: "TRIALING" | "ACTIVE" | "CANCELED" };

beforeAll(async () => {
  const rows = await prisma.user.findMany({
    where: { email: { in: ["anna@demo.se", "talent@acme.se", "hr@nordicsoft.se"] } },
  });
  for (const u of rows) users[u.email] = { id: u.id, role: u.role, name: u.name, email: u.email };
  acme = await prisma.company.findUniqueOrThrow({ where: { ownerId: users["talent@acme.se"].id } });
});
beforeEach(async () => {
  await prisma.company.update({
    where: { id: acme.id },
    data: { subscriptionStatus: acme.subscriptionStatus, trialEndsAt: acme.trialEndsAt },
  });
});
afterAll(async () => {
  await prisma.company.update({
    where: { id: acme.id },
    data: { subscriptionStatus: acme.subscriptionStatus, trialEndsAt: acme.trialEndsAt },
  });
  await prisma.$disconnect();
});

const expireAcmeTrial = () =>
  prisma.company.update({ where: { id: acme.id }, data: { trialEndsAt: new Date(Date.now() - 60_000) } });

describe("paid access", () => {
  it("a running trial and an active plan get through", async () => {
    session.user = users["talent@acme.se"];
    await expect(requirePaidAccess()).resolves.toMatchObject({ access: { allowed: true } });
    session.user = users["hr@nordicsoft.se"];
    await expect(requirePaidAccess()).resolves.toMatchObject({ access: { allowed: true, trialDaysLeft: null } });
  });

  it("an ended trial is sent to Billing", async () => {
    await expireAcmeTrial();
    session.user = users["talent@acme.se"];
    await expect(requirePaidAccess()).rejects.toMatchObject({
      digest: expect.stringContaining("/company/billing?locked=1"),
    });
  });

  it("a canceled plan is sent to Billing too", async () => {
    await prisma.company.update({ where: { id: acme.id }, data: { subscriptionStatus: "CANCELED" } });
    session.user = users["talent@acme.se"];
    await expect(requirePaidAccess()).rejects.toMatchObject({ digest: expect.stringContaining("/company/billing") });
  });

  it("outreach is refused server-side after the trial — nothing is sent", async () => {
    await expireAcmeTrial();
    session.user = users["talent@acme.se"];
    const fd = new FormData();
    fd.set("body", "Hi Anna, after my trial ended");
    const state = await startOutreach(users["anna@demo.se"].id, {}, fd);
    expect(state.error).toMatch(/free trial has ended/);
    expect(await prisma.message.count({ where: { body: "Hi Anna, after my trial ended" } })).toBe(0);
  });
});
