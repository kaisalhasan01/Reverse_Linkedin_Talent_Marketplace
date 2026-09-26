import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/roles";
import { SignInForm } from "@/components/auth/sign-in-form";

export default async function SignInPage() {
  const session = await auth();
  if (session?.user) redirect(ROLE_HOME[session.user.role]);

  return (
    <main className="mx-auto flex min-h-full w-full max-w-sm flex-col px-6 py-20">
      <Link href="/" className="text-sm text-zinc-500 hover:text-foreground">
        ← Back
      </Link>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Welcome back.</p>

      <div className="mt-8">
        <SignInForm />
      </div>

      <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-400">
        No account?{" "}
        <Link href="/sign-up" className="font-medium underline">
          Create one
        </Link>
      </p>
    </main>
  );
}
