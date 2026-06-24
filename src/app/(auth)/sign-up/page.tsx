import Link from "next/link";

/**
 * Account creation. The core "dual account type" choice lives here: a visitor
 * picks Candidate or Company. Real registration (Auth.js) arrives in Phase 3 —
 * for now the cards jump straight into each app shell so the skeleton is
 * clickable end to end.
 */
export default function SignUpPage() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-6 py-16">
      <Link href="/" className="text-sm text-zinc-500 hover:text-foreground">
        ← Back
      </Link>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight">Create your account</h1>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        Choose how you&apos;ll use Reverse.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          href="/candidate/feed"
          className="group rounded-2xl border border-black/10 p-6 transition-colors hover:border-foreground dark:border-white/15"
        >
          <h2 className="text-lg font-semibold">I&apos;m looking for work</h2>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Build a profile and get discovered by companies. Always free.
          </p>
          <span className="mt-4 inline-block text-sm font-medium text-zinc-500 group-hover:text-foreground">
            Continue as candidate →
          </span>
        </Link>

        <Link
          href="/company/dashboard"
          className="group rounded-2xl border border-black/10 p-6 transition-colors hover:border-foreground dark:border-white/15"
        >
          <h2 className="text-lg font-semibold">I&apos;m hiring</h2>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Search the talent database and reach out to people directly.
          </p>
          <span className="mt-4 inline-block text-sm font-medium text-zinc-500 group-hover:text-foreground">
            Continue as company →
          </span>
        </Link>
      </div>

      <p className="mt-8 text-sm text-zinc-500 dark:text-zinc-400">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-medium underline">
          Sign in
        </Link>
      </p>
      <p className="mt-2 text-xs text-zinc-400">
        Note: real auth (Auth.js) lands in Phase 3 — these links currently jump
        straight into the app shells without a login.
      </p>
    </main>
  );
}
