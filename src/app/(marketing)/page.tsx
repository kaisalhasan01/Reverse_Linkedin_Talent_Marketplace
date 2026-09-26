import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="flex flex-1 flex-col">
      {/* Top bar */}
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center px-6">
        <span className="text-lg font-semibold tracking-tight">Reverse</span>
        <nav className="ml-auto flex items-center gap-4 text-sm">
          <Link href="/sign-in" className="text-zinc-600 hover:text-foreground dark:text-zinc-300">
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="rounded-full bg-foreground px-4 py-2 font-medium text-background transition-opacity hover:opacity-90"
          >
            Get started
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 py-20">
        <span className="w-fit rounded-full border border-black/10 px-3 py-1 text-xs font-medium text-zinc-500 dark:border-white/15 dark:text-zinc-400">
          The job market, reversed
        </span>
        <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
          Stop applying. <br /> Get found.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-zinc-600 dark:text-zinc-300">
          On Reverse, people build a profile for free and companies do the
          reaching out. Flip a switch to <span className="font-medium text-foreground">Looking for work</span> and
          let recruiters come to you with real offers — salary, role and hours up front.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/sign-up"
            className="rounded-full bg-foreground px-6 py-3 text-center font-medium text-background transition-opacity hover:opacity-90"
          >
            Create your profile — it&apos;s free
          </Link>
          <Link
            href="/sign-up"
            className="rounded-full border border-black/15 px-6 py-3 text-center font-medium transition-colors hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
          >
            I&apos;m hiring
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-black/10 dark:border-white/10">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-16 sm:grid-cols-2">
          <div>
            <h2 className="text-xl font-semibold">For people — always free</h2>
            <ul className="mt-4 space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
              <li>• Build a rich profile: experience, education, projects, skills.</li>
              <li>• Toggle &ldquo;Looking for work&rdquo; to become visible to companies.</li>
              <li>• Post, connect and message — the social side, without the noise.</li>
            </ul>
          </div>
          <div>
            <h2 className="text-xl font-semibold">For companies — pay to reach</h2>
            <ul className="mt-4 space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
              <li>• Search and filter a live database of people open to work.</li>
              <li>• Message candidates directly with a concrete offer.</li>
              <li>• Subscribe per seat — like LinkedIn Recruiter, but candidate-first.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/10 dark:border-white/10">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-8 text-sm text-zinc-500">
          <span>© {new Date().getFullYear()} Reverse</span>
          <span className="flex gap-4">
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <span>Built with Next.js</span>
          </span>
        </div>
      </footer>
    </main>
  );
}
