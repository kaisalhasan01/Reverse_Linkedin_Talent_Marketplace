import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/roles";
import { SignUpForm } from "@/components/auth/sign-up-form";

export default async function SignUpPage() {
  const session = await auth();
  if (session?.user) redirect(ROLE_HOME[session.user.role]);

  return (
    <main className="mx-auto flex min-h-full w-full max-w-xl flex-col px-6 py-16">
      <Link href="/" className="text-sm text-zinc-500 hover:text-foreground">
        ← Back
      </Link>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight">Create your account</h1>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        Choose how you&apos;ll use Reverse.
      </p>

      <div className="mt-8">
        <SignUpForm />
      </div>

      <p className="mt-8 text-sm text-zinc-500 dark:text-zinc-400">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-medium underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}
