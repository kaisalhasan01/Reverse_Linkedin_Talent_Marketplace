/** Candidates answering structured job offers — only the recipient, only once. */
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
import { respondToOffer } from "@/components/messaging/actions";

const users: Record<string, SessionUser> = {};
let offerId = "";

beforeAll(async () => {
  const rows = await prisma.user.findMany({
    where: { email: { in: ["anna@demo.se", "erik@demo.se", "talent@acme.se"] } },
  });
  for (const u of rows) users[u.email] = { id: u.id, role: u.role, name: u.name, email: u.email };
  // Seed: Acme → Anna, "Senior Fullstack Engineer — Checkout Platform"
  offerId = (await prisma.jobOffer.findFirstOrThrow({ where: { title: { contains: "Checkout" } } })).id;
});
beforeEach(async () => {
  await prisma.jobOffer.update({ where: { id: offerId }, data: { status: "PENDING", respondedAt: null } });
});
afterAll(async () => {
  await prisma.jobOffer.update({ where: { id: offerId }, data: { status: "PENDING", respondedAt: null } });
  await prisma.$disconnect();
});

const status = async () => (await prisma.jobOffer.findUniqueOrThrow({ where: { id: offerId } })).status;

describe("respondToOffer", () => {
  it("the recipient can accept — the answer is recorded and posted to the thread", async () => {
    session.user = users["anna@demo.se"];
    await respondToOffer(offerId, true);

    const offer = await prisma.jobOffer.findUniqueOrThrow({ where: { id: offerId }, include: { message: true } });
    expect(offer.status).toBe("ACCEPTED");
    expect(offer.respondedAt).toBeInstanceOf(Date);
    const last = await prisma.message.findFirstOrThrow({
      where: { conversationId: offer.message.conversationId },
      orderBy: { createdAt: "desc" },
    });
    expect(last.senderId).toBe(users["anna@demo.se"].id);
    expect(last.body).toMatch(/Accepted your offer/);
  });

  it("can only be answered once", async () => {
    session.user = users["anna@demo.se"];
    await respondToOffer(offerId, false);
    await respondToOffer(offerId, true);
    expect(await status()).toBe("DECLINED");
  });

  it("a candidate outside the thread can't answer it", async () => {
    session.user = users["erik@demo.se"];
    await respondToOffer(offerId, true);
    expect(await status()).toBe("PENDING");
  });

  it("the company that sent it can't answer its own offer", async () => {
    session.user = users["talent@acme.se"];
    await expect(respondToOffer(offerId, true)).rejects.toThrow("NEXT_REDIRECT");
    expect(await status()).toBe("PENDING");
  });
});
