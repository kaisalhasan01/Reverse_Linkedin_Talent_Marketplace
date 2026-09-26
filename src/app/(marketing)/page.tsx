import Link from "next/link";
import type { ReactNode } from "react";

export default function LandingPage() {
  return (
    <main className="flex flex-1 flex-col overflow-x-hidden">
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
      <section className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 right-0 -z-10 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-emerald-200/60 via-sky-200/40 to-transparent blur-3xl dark:from-emerald-500/15 dark:via-sky-500/10"
        />
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-14 px-6 py-16 sm:py-24 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div>
            <span className="w-fit rounded-full border border-black/10 px-3 py-1 text-xs font-medium text-zinc-500 dark:border-white/15 dark:text-zinc-400">
              The job market, reversed
            </span>
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
              Stop applying. <br /> Get found.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-zinc-600 dark:text-zinc-300">
              On Reverse, people build a profile for free and companies do the reaching out. Flip a
              switch to <span className="font-medium text-foreground">Looking for work</span> and let
              recruiters come to you with real offers — salary, role and hours up front.
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
            <p className="mt-6 text-sm text-zinc-500">
              Free for candidates · 14-day free trial for companies · Import your CV in seconds
            </p>
          </div>

          <ProductPreview />
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-black/10 dark:border-white/10">
        <div className="mx-auto w-full max-w-6xl px-6 py-16">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">How it works</h2>
          <ol className="mt-6 grid gap-6 sm:grid-cols-3">
            <Step n={1} title="Build your profile">
              Experience, education, projects and skills — or upload your CV and approve what we
              read from it.
            </Step>
            <Step n={2} title="Flip to “Looking for work”">
              Only then can companies find you. Switch to Employed and you disappear from their
              search at once.
            </Step>
            <Step n={3} title="Get real offers">
              Companies reach out with salary, role, hours and location up front. Accept or decline
              with one click.
            </Step>
          </ol>
        </div>
      </section>

      {/* Audiences */}
      <section className="border-t border-black/10 dark:border-white/10">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-16 sm:grid-cols-2">
          <Audience title="For people — always free">
            <li>Build a rich profile: experience, education, projects, skills.</li>
            <li>Toggle &ldquo;Looking for work&rdquo; to become visible to companies.</li>
            <li>Post, connect and message — the social side, without the noise.</li>
          </Audience>
          <Audience title="For companies — pay to reach">
            <li>Search a live database of people who are open to work right now.</li>
            <li>Message candidates directly with a concrete, structured offer.</li>
            <li>Subscribe per seat — like LinkedIn Recruiter, but candidate-first.</li>
          </Audience>
        </div>
      </section>

      {/* Compliance as a feature */}
      <section className="border-t border-black/10 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.03]">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-14 sm:grid-cols-3">
          <Principle icon={<ScaleIcon />} title="Merit-only search">
            No gender, age or photo fields — so there are no filters for them either. Built for the
            Swedish Discrimination Act (2008:567).
          </Principle>
          <Principle icon={<EyeOffIcon />} title="Invisible when employed">
            &ldquo;Employed&rdquo; hides you from every company — enforced in the database, not just
            the interface.
          </Principle>
          <Principle icon={<ShieldIcon />} title="Your data, your call">
            Export everything as JSON or delete your account in one click. One essential cookie, no
            tracking.
          </Principle>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="border-t border-black/10 dark:border-white/10">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-6 px-6 py-16 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Let the offers come to you.</h2>
            <p className="mt-2 text-zinc-600 dark:text-zinc-300">It takes two minutes to set up a profile.</p>
          </div>
          <Link
            href="/sign-up"
            className="rounded-full bg-foreground px-6 py-3 font-medium text-background transition-opacity hover:opacity-90"
          >
            Get started
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/10 dark:border-white/10">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-8 text-sm text-zinc-500">
          <span>© {new Date().getFullYear()} Reverse</span>
          <Link href="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
        </div>
      </footer>
    </main>
  );
}

/** A static, illustrative slice of the real product UI: profile status + an incoming offer. */
function ProductPreview() {
  return (
    <div aria-hidden className="relative mx-auto w-full max-w-md select-none lg:mx-0">
      {/* Profile card */}
      <div className="rounded-2xl border border-black/10 bg-background p-5 shadow-sm dark:border-white/10">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-600 text-sm font-semibold text-white">
            AL
          </span>
          <div className="min-w-0">
            <p className="font-semibold">Anna Lindqvist</p>
            <p className="truncate text-sm text-zinc-500">Fullstack Developer — React, Node.js &amp; Postgres</p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2 dark:bg-emerald-500/10">
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Looking for work</span>
          <span className="flex h-5 w-9 items-center rounded-full bg-emerald-500 p-0.5">
            <span className="ml-auto h-4 w-4 rounded-full bg-white shadow" />
          </span>
        </div>
      </div>

      {/* Incoming offer */}
      <div className="relative -mt-3 ml-6 rounded-2xl border border-emerald-300/60 bg-background p-5 shadow-xl shadow-emerald-900/5 sm:ml-12 dark:border-emerald-500/30 dark:shadow-black/40">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-600 text-[10px] font-semibold text-white">
            AT
          </span>
          Acme Technologies sent you an offer
        </div>
        <p className="mt-3 font-semibold">Senior Fullstack Engineer</p>
        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-zinc-500">Salary</dt>
          <dd className="font-medium">62 000–72 000 SEK/month</dd>
          <dt className="text-zinc-500">Hours</dt>
          <dd>40 h/week</dd>
          <dt className="text-zinc-500">Location</dt>
          <dd>Stockholm (hybrid)</dd>
        </dl>
        <div className="mt-4 flex gap-2">
          <span className="rounded-full bg-foreground px-3 py-1.5 text-xs font-medium text-background">Accept offer</span>
          <span className="rounded-full border border-black/15 px-3 py-1.5 text-xs font-medium dark:border-white/20">Decline</span>
        </div>
      </div>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <li className="rounded-2xl border border-black/10 p-5 dark:border-white/10">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background">
        {n}
      </span>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{children}</p>
    </li>
  );
}

function Audience({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-black/10 p-6 dark:border-white/10">
      <h2 className="text-xl font-semibold">{title}</h2>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-zinc-600 marker:text-zinc-400 dark:text-zinc-300">
        {children}
      </ul>
    </div>
  );
}

function Principle({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div>
      <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-background text-foreground dark:border-white/10">
        {icon}
      </span>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{children}</p>
    </div>
  );
}

const iconProps = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function ScaleIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 3v18M7 21h10M5 7h14M5 7l-3 7a3 3 0 0 0 6 0L5 7Zm14 0-3 7a3 3 0 0 0 6 0l-3-7Z" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg {...iconProps}>
      <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A9.8 9.8 0 0 1 12 5c5 0 9 4.5 10 7-.4 1-1.2 2.3-2.4 3.5M6.2 6.2C4.3 7.5 2.8 9.4 2 12c1 2.5 5 7 10 7 1.6 0 3.1-.5 4.4-1.2" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
