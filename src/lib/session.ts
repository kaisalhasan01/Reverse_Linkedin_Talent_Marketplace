import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/roles";

/**
 * Session guards. Layouts call these to protect whole route subtrees, and
 * every server action calls them again so mutations are authorized even if
 * someone hits the action endpoint directly.
 */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");
  return session.user;
}

export async function requireCandidate() {
  const user = await requireUser();
  if (user.role !== "CANDIDATE") redirect(ROLE_HOME[user.role]);
  return user;
}

export async function requireCompany() {
  const user = await requireUser();
  if (user.role !== "COMPANY") redirect(ROLE_HOME[user.role]);
  return user;
}
