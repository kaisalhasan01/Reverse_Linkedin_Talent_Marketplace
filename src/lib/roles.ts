import type { Role } from "@prisma/client";

/**
 * Role helpers. The Role enum itself lives in the Prisma schema (CANDIDATE /
 * COMPANY) — this module only adds routing/UX concerns on top of it.
 */
export type { Role };

/** Where each role lands after signing in. */
export const ROLE_HOME: Record<Role, string> = {
  CANDIDATE: "/candidate/feed",
  COMPANY: "/company/dashboard",
};

/** Runtime guard — handy when reading a role off a form or token. */
export function isRole(value: unknown): value is Role {
  return value === "CANDIDATE" || value === "COMPANY";
}
