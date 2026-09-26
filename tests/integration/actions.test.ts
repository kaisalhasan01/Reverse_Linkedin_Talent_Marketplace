/**
 * Server actions called directly — the way an attacker would, bypassing
 * the UI — with a mocked session that behaves like the real guards
 * (wrong role → redirect, which throws).
 */
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
import { addComment, createPost, toggleLike } from "@/app/candidate/feed/actions";
import { sendConnectionRequest } from "@/app/candidate/connections/actions";
import { addExperience, addProject } from "@/app/candidate/profile/actions";
import { startOutreach } from "@/app/company/candidates/[id]/actions";

const users: Record<string, SessionUser> = {};
const as = (email: string) => (session.user = users[email]);
const form = (fields: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
};

beforeAll(async () => {
  const rows = await prisma.user.findMany({
    where: { email: { in: ["anna@demo.se", "erik@demo.se", "lisa@demo.se", "talent@acme.se", "hr@nordicsoft.se"] } },
  });
  for (const u of rows) users[u.email] = { id: u.id, role: u.role, name: u.name, email: u.email };
});
beforeEach(() => {
  session.user = null;
});
afterAll(() => prisma.$disconnect());

describe("feed — candidates only", () => {
  it("a company session can't post, like or comment", async () => {
    as("talent@acme.se");
    const post = await prisma.post.findFirstOrThrow();
    await expect(createPost(form({ content: "Company spam" }))).rejects.toThrow("NEXT_REDIRECT");
    await expect(toggleLike(post.id)).rejects.toThrow("NEXT_REDIRECT");
    await expect(addComment(post.id, form({ content: "Company spam" }))).rejects.toThrow("NEXT_REDIRECT");
    expect(await prisma.post.count({ where: { content: "Company spam" } })).toBe(0);
    expect(await prisma.comment.count({ where: { content: "Company spam" } })).toBe(0);
  });

  it("a candidate can post; liking twice toggles back", async () => {
    as("erik@demo.se");
    await createPost(form({ content: "Integration test post" }));
    const post = await prisma.post.findFirstOrThrow({ where: { content: "Integration test post" } });

    await toggleLike(post.id);
    expect(await prisma.like.count({ where: { postId: post.id } })).toBe(1);
    await toggleLike(post.id);
    expect(await prisma.like.count({ where: { postId: post.id } })).toBe(0);

    await prisma.post.delete({ where: { id: post.id } });
  });

  it("liking or commenting on a post that doesn't exist is a no-op, not a crash", async () => {
    as("erik@demo.se");
    await expect(toggleLike("does-not-exist")).resolves.toBeUndefined();
    await expect(addComment("does-not-exist", form({ content: "hi" }))).resolves.toBeUndefined();
  });
});

describe("connections — candidate ↔ candidate only", () => {
  it("ignores requests to company accounts and unknown ids", async () => {
    as("erik@demo.se");
    await sendConnectionRequest(users["talent@acme.se"].id);
    await sendConnectionRequest("does-not-exist");
    expect(
      await prisma.connection.count({ where: { requesterId: users["erik@demo.se"].id, addressee: { role: "COMPANY" } } }),
    ).toBe(0);
  });
});

describe("profile input validation", () => {
  it("never stores a javascript: project link", async () => {
    as("erik@demo.se");
    await addProject(form({ name: "Evil", url: "javascript:alert(document.cookie)", description: "" }));
    expect(await prisma.project.count({ where: { name: "Evil" } })).toBe(0);
  });

  it("rejects an experience that ends before it starts", async () => {
    as("erik@demo.se");
    await addExperience(form({ title: "Time traveller", company: "Acme", startDate: "2024-01-01", endDate: "2020-01-01" }));
    expect(await prisma.experience.count({ where: { title: "Time traveller" } })).toBe(0);
  });
});

describe("company outreach", () => {
  it("returns the error and the typed values when the offer is invalid", async () => {
    as("talent@acme.se");
    const values = { body: "Hi Erik!", offerTitle: "ML Engineer", salaryMin: "90000", salaryMax: "60000", hoursPerWeek: "", offerLocation: "" };
    const state = await startOutreach(users["erik@demo.se"].id, {}, form(values));
    expect(state.error).toMatch(/Minimum salary/);
    expect(state.values).toEqual(values);
  });

  it("refuses to contact an EMPLOYED candidate", async () => {
    as("talent@acme.se");
    const state = await startOutreach(users["lisa@demo.se"].id, {}, form({ body: "Hi Lisa!" }));
    expect(state.error).toMatch(/isn't available/);
    expect(
      await prisma.message.count({ where: { body: "Hi Lisa!" } }),
    ).toBe(0);
  });

  it("sends the message with a structured offer and redirects to the thread", async () => {
    as("hr@nordicsoft.se");
    await expect(
      startOutreach(users["erik@demo.se"].id, {}, form({ body: "Hi Erik — offer inside", offerTitle: "ML Lead", salaryMin: "70000", salaryMax: "85000", hoursPerWeek: "40", offerLocation: "Göteborg" })),
    ).rejects.toThrow(/NEXT_REDIRECT/);
    const msg = await prisma.message.findFirstOrThrow({ where: { body: "Hi Erik — offer inside" }, include: { offer: true } });
    expect(msg.offer).toMatchObject({ title: "ML Lead", salaryMin: 70000, salaryMax: 85000, hoursPerWeek: 40, location: "Göteborg" });
  });
});
