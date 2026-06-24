import Link from "next/link";

export default function SignInPage() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-sm flex-col px-6 py-20">
      <Link href="/" className="text-sm text-zinc-500 hover:text-foreground">
        ← Back
      </Link>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Welcome back.</p>

      <div className="mt-8 rounded-xl border border-dashed border-black/15 p-8 text-sm text-zinc-400 dark:border-white/15">
        Sign-in form arrives in Phase 3 (Auth.js).
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
