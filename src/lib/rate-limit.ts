import { headers } from "next/headers";
import { prisma } from "@/lib/db";

/**
 * Fixed-window rate limiting backed by Postgres — no Redis needed, and the
 * limits hold across serverless instances (in-memory counters would reset
 * per instance). Each hit is one atomic upsert (INSERT … ON CONFLICT).
 */

export const LIMITS = {
  signInPerEmail: { limit: 10, windowSeconds: 15 * 60 },
  signInPerIp: { limit: 30, windowSeconds: 15 * 60 },
  signUpPerIp: { limit: 5, windowSeconds: 60 * 60 },
  outreachPerCompany: { limit: 50, windowSeconds: 24 * 60 * 60 },
} as const;

export type RateLimitResult = { ok: boolean; retryAfterSeconds: number };

export async function rateLimit(
  key: string,
  { limit, windowSeconds }: { limit: number; windowSeconds: number },
): Promise<RateLimitResult> {
  const now = new Date();

  // Start a fresh window if the old one has expired, then count this hit.
  await prisma.rateLimit.deleteMany({ where: { key, resetAt: { lte: now } } });
  const hit = await prisma.rateLimit.upsert({
    where: { key },
    create: { key, count: 1, resetAt: new Date(now.getTime() + windowSeconds * 1000) },
    update: { count: { increment: 1 } },
  });

  // Keep the table small: now and then, drop every expired window.
  if (Math.random() < 0.01) {
    await prisma.rateLimit.deleteMany({ where: { resetAt: { lte: now } } });
  }

  return {
    ok: hit.count <= limit,
    retryAfterSeconds: Math.max(1, Math.ceil((hit.resetAt.getTime() - now.getTime()) / 1000)),
  };
}

/** Take one hit back — a successful sign-in shouldn't use up the budget. */
export async function forgive(key: string) {
  await prisma.rateLimit.updateMany({ where: { key, count: { gt: 0 } }, data: { count: { decrement: 1 } } });
}

/** "Try again in 12 minutes" — for error messages. */
export function retryIn(seconds: number) {
  if (seconds < 90) return `${seconds} seconds`;
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 90) return `${minutes} minutes`;
  return `${Math.ceil(minutes / 60)} hours`;
}

/** Best-effort client IP (Vercel and most proxies set x-forwarded-for). */
export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}
