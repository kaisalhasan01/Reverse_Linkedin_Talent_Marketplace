import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

// Sign-in is exercised through the real server action with Auth.js mocked:
// a password counts as correct when it equals "right".
const auth = vi.hoisted(() => {
  class AuthError extends Error {}
  return { AuthError, signIn: vi.fn() };
});
vi.mock("next-auth", () => ({ AuthError: auth.AuthError }));
vi.mock("@/lib/auth", () => ({ signIn: auth.signIn, signOut: vi.fn() }));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-forwarded-for": "203.0.113.9, 10.0.0.1" }) }));

import { prisma } from "@/lib/db";
import { forgive, rateLimit } from "@/lib/rate-limit";
import { login } from "@/app/(auth)/actions";

const form = (email: string, password: string) => {
  const fd = new FormData();
  fd.set("email", email);
  fd.set("password", password);
  return fd;
};

beforeEach(async () => {
  await prisma.rateLimit.deleteMany();
  auth.signIn.mockReset();
  auth.signIn.mockImplementation(async (_provider: string, { password }: { password: string }) => {
    if (password !== "right") throw new auth.AuthError("CredentialsSignin");
  });
});
afterAll(async () => {
  await prisma.rateLimit.deleteMany();
  await prisma.$disconnect();
});

describe("rateLimit()", () => {
  it("allows `limit` hits per window, then refuses with a retry time", async () => {
    const opts = { limit: 3, windowSeconds: 600 };
    const results = [];
    for (let i = 0; i < 4; i++) results.push(await rateLimit("t:basic", opts));
    expect(results.map((r) => r.ok)).toEqual([true, true, true, false]);
    expect(results[3].retryAfterSeconds).toBeGreaterThan(590);
  });

  it("starts a fresh window once the old one has expired", async () => {
    const opts = { limit: 1, windowSeconds: 600 };
    await rateLimit("t:expiry", opts);
    expect((await rateLimit("t:expiry", opts)).ok).toBe(false);
    await prisma.rateLimit.update({ where: { key: "t:expiry" }, data: { resetAt: new Date(Date.now() - 1000) } });
    expect((await rateLimit("t:expiry", opts)).ok).toBe(true);
  });

  it("is atomic: 20 parallel hits against a limit of 5 let exactly 5 through", async () => {
    const results = await Promise.all(
      Array.from({ length: 20 }, () => rateLimit("t:burst", { limit: 5, windowSeconds: 600 })),
    );
    expect(results.filter((r) => r.ok)).toHaveLength(5);
  });

  it("forgive() gives one hit back", async () => {
    const opts = { limit: 1, windowSeconds: 600 };
    await rateLimit("t:forgive", opts);
    await forgive("t:forgive");
    expect((await rateLimit("t:forgive", opts)).ok).toBe(true);
  });
});

describe("sign-in brute-force protection", () => {
  it("blocks the 11th wrong password for an account — before the password check runs", async () => {
    for (let i = 0; i < 10; i++) {
      expect(await login({}, form("victim@example.se", `guess-${i}`))).toEqual({ error: "Invalid email or password" });
    }
    const blocked = await login({}, form("victim@example.se", "guess-10"));
    expect(blocked.error).toMatch(/Too many sign-in attempts/);
    expect(auth.signIn).toHaveBeenCalledTimes(10);
  });

  it("successful sign-ins don't use up the budget", async () => {
    for (let i = 0; i < 15; i++) {
      await expect(login({}, form("anna@demo.se", "right"))).rejects.toThrow(/NEXT_REDIRECT/);
    }
    const row = await prisma.rateLimit.findUnique({ where: { key: "signin:email:anna@demo.se" } });
    expect(row?.count).toBe(0);
  });

  it("limits per network too, keyed on the first x-forwarded-for hop", async () => {
    for (let i = 0; i < 30; i++) await login({}, form(`user${i}@example.se`, "wrong"));
    expect((await login({}, form("fresh@example.se", "wrong"))).error).toMatch(/Too many/);
    expect(await prisma.rateLimit.findUnique({ where: { key: "signin:ip:203.0.113.9" } })).not.toBeNull();
  });
});
