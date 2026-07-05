import Link from "next/link";

export const metadata = { title: "Privacy Policy — Reverse" };

/**
 * Honest to the implementation: everything stated here maps to actual
 * behavior in the codebase (visibility rules, export, deletion, cookies).
 */
export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-16">
      <Link href="/" className="text-sm text-zinc-500 hover:text-foreground">
        ← Back
      </Link>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-zinc-500">Last updated: 5 July 2026</p>

      <div className="prose-sm mt-8 space-y-6 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        <section>
          <h2 className="text-base font-semibold text-foreground">What we collect</h2>
          <p className="mt-2">
            Your account (name, email, a hashed password — never the password itself) and the
            content you choose to add: profile details, experience, education, projects, skills,
            certifications, posts, comments, likes, connections and messages. Company accounts
            additionally store company details and subscription state.
          </p>
          <p className="mt-2">
            <strong>What we deliberately don&apos;t collect:</strong> gender, date of birth, photo or
            other protected attributes. Recruiters on Reverse search on merit — the Swedish
            Discrimination Act (2008:567) and GDPR data minimisation are design constraints here,
            not afterthoughts.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">Who can see what</h2>
          <p className="mt-2">
            Your profile is visible to paying companies <em>only</em> while your status is
            &ldquo;Looking for work&rdquo;. Switch to &ldquo;Employed&rdquo; and you disappear from company search and
            candidate views immediately — enforced in the database queries, not just hidden in
            the interface. Posts are visible to signed-in candidates. Messages are visible only
            to the two participants.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">CV import</h2>
          <p className="mt-2">
            If you upload a CV, we extract its text on our server. When AI-assisted parsing is
            enabled, the text is sent to Anthropic&apos;s Claude API to structure it; per Anthropic&apos;s
            API terms it is not used to train models. Nothing is saved to your profile until you
            review and approve it, and the parsed draft is deleted when you apply it, discard it
            or delete your account.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">Cookies</h2>
          <p className="mt-2">
            One essential session cookie keeps you signed in. No tracking, no analytics, no
            third-party cookies — which is why there is no cookie banner.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">Your rights</h2>
          <p className="mt-2">
            From your account settings you can <strong>export</strong> everything we store about you as
            JSON (Art. 20 GDPR) and <strong>delete your account</strong> (Art. 17) — deletion is immediate
            and cascades through profile, posts, connections and messages. You can correct any
            data at any time by editing your profile. Questions:{" "}
            <a href="mailto:privacy@reverse.example" className="underline">privacy@reverse.example</a>.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">Retention & legal basis</h2>
          <p className="mt-2">
            We process your data to provide the service you signed up for (Art. 6(1)(b) GDPR)
            and keep it only while your account exists. We don&apos;t sell data, run ads or profile
            you.
          </p>
        </section>
      </div>
    </main>
  );
}
