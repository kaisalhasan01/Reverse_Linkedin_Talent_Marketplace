import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import {
  createMessage,
  getConversation,
  getOrCreateConversation,
  listConversations,
} from "@/lib/messaging";

const ids: Record<string, string> = {};

beforeAll(async () => {
  const users = await prisma.user.findMany({
    where: { email: { in: ["anna@demo.se", "erik@demo.se", "talent@acme.se"] } },
  });
  for (const u of users) ids[u.email] = u.id;
});

afterAll(() => prisma.$disconnect());

describe("messaging data layer", () => {
  it("lists conversations newest message first", async () => {
    const list = await listConversations(ids["anna@demo.se"]);
    expect(list.length).toBeGreaterThanOrEqual(2);
    const times = list.map((c) => c.lastAt.getTime());
    expect(times).toEqual([...times].sort((a, b) => b - a));
    // Seed: Acme's offer thread (2h ago) is fresher than Erik's DM (25h ago).
    expect(list[0].otherName).toBe("Acme Talent Team");
  });

  it("reuses the existing 1:1 thread instead of opening a second one", async () => {
    const a = await getOrCreateConversation(ids["anna@demo.se"], ids["erik@demo.se"]);
    const b = await getOrCreateConversation(ids["erik@demo.se"], ids["anna@demo.se"]);
    expect(a.id).toBe(b.id);
  });

  it("hides a thread from anyone who isn't a participant", async () => {
    const dm = await getOrCreateConversation(ids["anna@demo.se"], ids["erik@demo.se"]);
    expect(await getConversation(dm.id, ids["talent@acme.se"])).toBeNull();
    expect(await getConversation(dm.id, ids["anna@demo.se"])).not.toBeNull();
  });

  it("refuses to post into a thread the sender isn't part of", async () => {
    const dm = await getOrCreateConversation(ids["anna@demo.se"], ids["erik@demo.se"]);
    await expect(createMessage(dm.id, ids["talent@acme.se"], "Hi!")).rejects.toThrow(/participant/);
  });
});
