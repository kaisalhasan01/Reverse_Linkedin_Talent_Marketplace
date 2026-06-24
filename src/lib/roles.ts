/**
 * The two account types on the platform.
 *
 * Individuals (candidates) use Reverse for free; companies pay for access to the
 * candidate database. Kept as a `const` object so the values can be shared
 * between client and server code, and so they mirror the Prisma `Role` enum we
 * add in Phase 2.
 */
export const ROLES = {
  CANDIDATE: "CANDIDATE",
  COMPANY: "COMPANY",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/** Where each role lands after signing in. */
export const ROLE_HOME: Record<Role, string> = {
  CANDIDATE: "/candidate/feed",
  COMPANY: "/company/dashboard",
};

/** Runtime guard — handy when reading a role off a session, token or form. */
export function isRole(value: unknown): value is Role {
  return value === ROLES.CANDIDATE || value === ROLES.COMPANY;
}
