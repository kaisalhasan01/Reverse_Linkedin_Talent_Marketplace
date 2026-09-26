"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { signIn, signOut } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/roles";
import { trialEndDate } from "@/lib/billing";
import { LIMITS, clientIp, forgive, rateLimit, retryIn } from "@/lib/rate-limit";

export type AuthFormState = { error?: string };

const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your name"),
  email: z.email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["CANDIDATE", "COMPANY"]),
  companyName: z.string().trim().optional(),
});

export async function register(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const limited = await rateLimit(`signup:ip:${await clientIp()}`, LIMITS.signUpPerIp);
  if (!limited.ok) {
    return { error: `Too many new accounts from this network. Try again in ${retryIn(limited.retryAfterSeconds)}.` };
  }

  const { name, password, role, companyName } = parsed.data;
  const email = parsed.data.email.toLowerCase();

  if (role === "COMPANY" && !companyName) return { error: "Enter your company name" };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with that email already exists" };

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      role,
      // Each role gets its counterpart record from day one.
      ...(role === "CANDIDATE"
        ? { candidateProfile: { create: {} } }
        : { company: { create: { name: companyName!, trialEndsAt: trialEndDate() } } }),
    },
  });

  // Auto sign-in; throws a redirect to the role's home on success.
  await signIn("credentials", { email, password, redirectTo: ROLE_HOME[role] });
  return {};
}

export async function login(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").toLowerCase();
  const password = String(formData.get("password") ?? "");

  // Brute-force protection, per account and per network. Every attempt is
  // counted up front (atomically, so parallel guesses can't slip through)
  // before the deliberately slow bcrypt check; a successful sign-in gives
  // its attempt back, so only failures use up the budget.
  const keys = [`signin:email:${email}`, `signin:ip:${await clientIp()}`];
  const limits = [LIMITS.signInPerEmail, LIMITS.signInPerIp];
  for (const [i, key] of keys.entries()) {
    const limited = await rateLimit(key, limits[i]);
    if (!limited.ok) {
      return { error: `Too many sign-in attempts. Try again in ${retryIn(limited.retryAfterSeconds)}.` };
    }
  }

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (err) {
    if (err instanceof AuthError) return { error: "Invalid email or password" };
    throw err; // let Next.js redirects etc. propagate
  }
  await Promise.all(keys.map(forgive));

  const user = await prisma.user.findUnique({ where: { email }, select: { role: true } });
  redirect(user ? ROLE_HOME[user.role] : "/");
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
