# Reverse — complete project handoff

**Written:** 2026-09-26, when Kais moved development from his Mac to his PC.
**State at handoff:** commit `4f33b07` + this handoff commit. Working tree clean, no git remote.

> **To Claude Code on the new machine:** read this whole file once, on your first session.
> It replaces the entire earlier conversation — Kais should never have to re-explain the
> project. After that, `AGENTS.md` is the short version loaded every session.
> Talk to Kais in **Swedish**; code, comments and commits in **English**.

> **Update — 2026-09-26 evening (cloud session):** the full source is on GitHub
> (`kaisalhasan01/Reverse_Linkedin_Talent_Marketplace`) and a hardening pass is in PR #1 —
> see `SESSION-LOG.md` for every change. From §8 below, items **1** (paid access now enforced
> with a 14-day trial — Stripe itself still to do), **2** (rate limiting), **8** (offers can be
> accepted/declined), **11** (tests + CI) and **14** (dead code) are resolved. New finding:
> sign-in was broken under `next start` (Auth.js `UntrustedHost`) — fixed with `trustHost`.

---

## 1. TL;DR

- **Reverse** is a *reversed LinkedIn*: individuals build a profile for free, companies pay to
  search a database of people marked **"Looking for work"** and message them with **structured
  job offers** (title, salary range, hours, location). Plus a LinkedIn-style social layer.
- A complete, working MVP exists: dual-role auth, candidate app, company app, full-text search
  with lawful filters, messaging with offers, social feed, GDPR tooling, and CV import.
- Stack: Next.js 16 (App Router) · TypeScript · Prisma 6 · PostgreSQL · Auth.js v5 · Tailwind v4 · Zod.
- **Not built yet:** Stripe billing, deployment, email verification/password reset, hardening.
- **Hard legal constraint:** no gender/age/photo fields or filters, ever (§3).
- **First job on the PC:** set up and verify the project (§6), then offer to push it to a
  private GitHub repo — today it exists only on one laptop with no remote.

---

## 2. The vision

### Kais's original brief (2026-06-17, verbatim, lightly trimmed)

> **Projekt: Reverse LinkedIn — Talent Marketplace**
>
> Jag vill bygga en webapplikation som vänder på logiken i LinkedIn och traditionell jobbannonsering.
> Istället för att företag lägger ut jobbannonser och kandidater söker, så gör det tvärtom:
> - **Privatpersoner** skapar en profil med erfarenheter, utbildningar, projekt, skills osv — gratis
> - **Företag** betalar för tillgång till databasen och kan söka/filtrera bland profiler
> - Företag kan se kandidater som är markerade som "Looking for work" och skicka direkta
>   meddelanden med jobberbjudanden (lön, position, arbetstimmar, tjänst osv)
>
> **Social Layer (som LinkedIn):** posts/feed, connections/vänner, status-toggle
> "Looking for work" / "Employed" (bara synlig i databasen för företag om man är "Looking"),
> profil med erfarenhet, utbildning, projekt, skills, certifieringar.
>
> **Affärsmodell:** privatpersoner helt gratis. Företag betalar prenumeration för databasåtkomst
> (tänk LinkedIn Recruiter men bättre). Monetisering via Stripe, per seat/månad eller per hire.
>
> **MVP:** registrering för två kontotyper (Kandidat/Företag), kandidatprofil med
> Looking/Employed-toggle, företagsdashboard med sökbar databas, direktmeddelanden, enkel feed.

### Kais's second brief (2026-07-06, after seeing the first version)

> Det finns möjlighet för mer filter, mer data, mer möjligheter. Exempelvis vilket universitet,
> kan jobba på distans, kön, ålder, arbetserfarenhet, vilka företag han har jobbat hos,
> gemensamma vänner och mycket mer. Försök vara **bättre versionen av LinkedIn som gör det
> smidigare för både rekryteraren och arbetssökanden.** Kanske ett val att ladda upp CV så kan
> vi läsa in all info utan behov för dem att skriva om allting, eller bara ge deras LinkedIn-länk.
> Jag vill att sidan ska vara **proffsig men följer alla regler** (diskrimineringslagen med
> filtren och allting annat), **sekretess och GDPR**.

Everything from the second brief was built **except** gender/age filters (illegal — his own
compliance requirement overrides the feature request) and LinkedIn-link import (violates
LinkedIn's terms). CV upload covers the same need lawfully. Kais agreed to both.

### Product values that follow from the vision

1. **"Employed" = invisible.** Switching to Employed removes you from company search and
   candidate detail pages at once — enforced in SQL, never just hidden in the UI.
2. **Compliance is a selling point**, not a limitation: recruiters search on merit only.
3. **Real terms up front.** Outreach carries a structured offer so candidates see salary,
   role and hours before replying — the core difference from LinkedIn InMail.
4. **Professional and aesthetically pleasing** — Kais treats looks as a requirement.

### Who and why

Kais Alhasan — MSc mechanical engineering student at Linköping University. Builds monetizable
side projects that double as CV/portfolio pieces. He is not a professional web developer and
likes to understand what's being built. Launch target was September 2026 after his exams.

---

## 3. Decided — don't reopen

| Decision | Why | Where |
|---|---|---|
| No gender, age, birth date or photo fields/filters | Diskrimineringslagen 2008:567 + GDPR data minimisation. Kais's explicit requirement | Whole schema; CV parser prompt ignores them |
| "Employed = hidden" enforced in SQL + re-checked on detail page | A UI-only hide would leak via URLs | `src/lib/search.ts`, `src/app/company/candidates/[id]/page.tsx` |
| No LinkedIn scraping/import | Violates LinkedIn ToS; legally murky | — (CV import instead) |
| Auth.js (self-hosted) instead of Clerk | Kais chose it: building auth himself has portfolio value | `src/lib/auth.ts` |
| Postgres + Prisma; Supabase planned for production | Real Postgres features (full-text search, arrays) | `prisma/schema.prisma` |
| `embedded-postgres` for local dev (not Docker, not `prisma dev`) | `prisma dev` (WASM Postgres) fails with Prisma migrate (error P1017); Mac had no Docker/Homebrew | `scripts/db-server.mjs` |
| `/candidate/*` and `/company/*` as literal URL segments, not route groups | Both need `/messages`, `/settings`; route groups collapse to the same URL → build error | `src/app/candidate`, `src/app/company` |
| Authorization in the data layer | Layout guards only redirect; every server action re-checks the role, ownership is part of the query | `src/lib/session.ts`, all `actions.ts` |
| CV import is review-first; only extracted text goes to the AI | GDPR: nothing saved without consent; the file never leaves our server | `src/lib/cv/`, `src/app/candidate/profile/import/` |
| UI copy in English, chat with Kais in Swedish | International, CV-presentable product | — |
| Brand name "Reverse" is a working title | Never checked for trademark/domain | — |

---

## 4. Current state

### Works end-to-end (verified with scripted HTTP checks during development)

**Auth:** sign-up with role choice (creates a `CandidateProfile` or `Company` row in the same
write), auto sign-in, sign-in with error states, sign-out, role guards on both subtrees.

**Candidate app (free):**
- Feed: write posts, like/unlike, inline comments (global feed, newest 50)
- Profile: headline, location, skills, about, open-to-remote, **Looking/Employed toggle**,
  add/remove experience, education, projects, certifications
- **CV import:** upload PDF (≤5 MB) → text extracted on our server → structured by Claude
  (`claude-opus-4-8`, structured outputs) if `ANTHROPIC_API_KEY` is set, else by a local
  heuristic → review screen with a checkbox per item → apply or discard (draft deleted either way).
  No API key has been added yet, so today the heuristic runs.
- Connections: incoming invitations (accept/decline), your connections, "people you may know"
  with **"N mutual connections"**
- Messages: two-pane inbox, job offers rendered as cards, replies
- Settings: download my data (JSON), delete account

**Company app (paid, billing not wired):**
- Dashboard: candidates looking now, new this week, your conversations, offers sent, recently active
- **Search:** Postgres full-text search (`websearch_to_tsquery` + `ts_rank`, supports
  `react "design systems" -java`) over headline, bio, skills, location, name, work history and
  education. Filters: skill, location, university, past employer, minimum years of experience
  (computed from experience dates in SQL), open to remote. Only LOOKING candidates, max 30 results.
- Candidate detail page (same profile component, read-only) + outreach form with optional
  structured offer (title, salary min/max SEK/month, hours/week, location)
- Messages (same inbox), billing page (plan cards, buttons disabled), settings (export/delete)

**Public:** landing page, `/privacy` (a policy that describes what the code actually does).

### Not built

Stripe checkout/webhooks/access gating · deployment · email verification · password reset ·
notifications · realtime messages / unread state · pagination · team accounts (multiple
recruiters per company) · terms of service page · automated tests/CI.

### Demo data (`npm run db:seed`)

12 Swedish candidates — 9 LOOKING, 3 EMPLOYED (Lisa Öberg, Karl Axelsson, Gustav Lund, who
must never appear in company search). 2 companies: Acme Technologies (TRIALING) and Nordic
Software (ACTIVE). Posts, likes, comments, connections, an Acme→Anna thread with an offer,
and an Anna↔Erik DM.

| Role | Email | Password |
|---|---|---|
| Candidate | `anna@demo.se` | `Passw0rd!` |
| Company | `talent@acme.se` | `Passw0rd!` |
| Company | `hr@nordicsoft.se` | `Passw0rd!` |

⚠️ **The seed wipes every table first.** Never run it against a production database.

---

## 5. Architecture and file map

### Data model (16 models, `prisma/schema.prisma`)

- **Accounts:** `User` (email, bcrypt `passwordHash`, `role` CANDIDATE|COMPANY) → one
  `CandidateProfile` *or* one `Company` (`ownerId` is unique → one user per company for now).
- **Candidate:** `CandidateProfile` (headline, bio, location, `skills String[]`,
  `status` LOOKING|EMPLOYED, `openToRemote`) → `Experience`, `Education`, `Project`, `Certification`.
- **Company:** `Company` (name, website, about, `subscriptionStatus` TRIALING|ACTIVE|CANCELED,
  `seats`, `stripeCustomerId` — prepared for Stripe).
- **Social:** `Connection` (requester → addressee, PENDING|ACCEPTED|DECLINED, unique pair),
  `Post`, `Like` (composite key), `Comment`.
- **Messaging:** `Conversation` ← `ConversationParticipant` → `Message` → optional `JobOffer` (1:1).
- **CV import:** `ImportDraft` (one per user, JSON payload awaiting review).
- Two migrations: `20260705114039_init`, `20260705172102_add_import_draft`.
- Every relation cascades on delete — deleting a `User` removes everything they own.

### URL map

| URL | What | Guard |
|---|---|---|
| `/` , `/privacy` | Landing, privacy policy | public |
| `/sign-in`, `/sign-up` | Auth (redirects if already signed in) | public |
| `/candidate/feed · profile · profile/import · connections · messages · settings` | Candidate app | `requireCandidate()` |
| `/company/dashboard · search · candidates/[id] · messages · billing · settings` | Company app | `requireCompany()` |
| `/api/auth/[...nextauth]` | Auth.js handler | — |
| `/api/me/export` | GDPR JSON export (password hash excluded) | session |

### Key files

| File | Why it matters |
|---|---|
| `src/lib/auth.ts` | Auth.js config: credentials + bcrypt, JWT carries `id` and `role` |
| `src/lib/session.ts` | `requireUser` / `requireCandidate` / `requireCompany` — used by layouts **and** actions |
| `src/lib/search.ts` | Core of the paid product: one `Prisma.sql` fragment defines the search document for both matching and ranking; filters as `EXISTS` subqueries |
| `src/lib/messaging.ts` | Conversations; participant checks live inside the queries |
| `src/lib/cv/` | `types.ts` (Zod schema = structured-output schema), `extract-text.ts` (PDF → lines), `parse-claude.ts`, `parse-heuristic.ts`, `index.ts` (engine choice + fallback) |
| `src/components/profile/profile-display.tsx` | One profile renderer for the editable own-profile view and the company read-only view |
| `src/components/messaging/inbox.tsx` | One inbox for both roles |
| `src/app/**/actions.ts` | Server actions, colocated with their route, Zod-validated |
| `scripts/db-server.mjs` | Local Postgres 18 on port 5433, data in `.pgdata/` (gitignored) |
| `prisma/seed.ts` | Demo data (destructive) |
| `.claude/launch.json` | Dev server definitions for `preview_start` (`db`, then `web`) |

### Patterns to keep

- **Server actions get IDs via `.bind(null, id)`** and re-check the session inside.
- **Ownership in the query:** `deleteMany({ where: { id, profileId } })`, `updateMany` with
  `addresseeId: user.id` — a forged ID simply matches nothing.
- **Raw SQL only via `Prisma.sql` / `Prisma.join`** (parameterized, no string concatenation).
  Postgres reads `ORDER BY 0` as a column number — build `ORDER BY` conditionally (a real bug we hit).
- **Next.js 16 differs from older versions.** `AGENTS.md` says: read the relevant guide in
  `node_modules/next/dist/docs/` before writing Next.js code. `params`/`searchParams` are Promises.
- **Zod v4:** `z.email()`, `z.url()` — not `z.string().email()`.

---

## 6. Setting up on the PC

### What Kais does (three steps)

1. Install **Node.js 24 LTS** (nodejs.org, or `winget install OpenJS.NodeJS.LTS`) and **Git**
   (`winget install Git.Git`).
2. Unzip the handoff so the repo lands at a short path **outside OneDrive**, e.g.
   `C:\dev\reverse-linkedin`. (OneDrive has made his files vanish before, and syncing
   `node_modules` is painful.)
3. Open Claude Code in that folder and say: *"Läs HANDOFF.md och sätt upp projektet."*

### What Claude Code does

Kais's rule: **never give him multi-terminal instructions to run himself** — use the preview
tools. Run these yourself, narrating each step in Swedish:

```bash
node -v                      # expect v24.x
npm install                  # also installs the Windows Postgres binaries (@embedded-postgres/windows-x64)
# create .env from .env.example, then set AUTH_SECRET to the output of:
node -e "console.log(require('crypto').randomBytes(33).toString('base64'))"
npx prisma generate
```

Then `preview_start` **`db`** (first run creates `.pgdata/` and the `reverse` database), then:

```bash
npx prisma migrate deploy    # applies the two migrations, non-interactive
npm run db:seed
npm run build                # should pass cleanly (TypeScript + ESLint)
```

Then `preview_start` **`web`**, sign in as `talent@acme.se`, search `react postgres`
(Anna Lindqvist should rank first), and **share a screenshot as proof** before saying it works.

`.env` needs `DATABASE_URL` (the local default in `.env.example` is right), `AUTH_SECRET`, and
optionally `ANTHROPIC_API_KEY`. Never commit `.env`.

### Windows risks — honest caveats

The project was only ever run on macOS (Intel). These are **unverified on Windows**:

- **Local Postgres (`embedded-postgres`).** Binaries are in the lockfile, but Postgres refuses to
  run with administrator rights — don't run from an elevated terminal. It may also need the
  *Microsoft Visual C++ Redistributable*.
- **Stopping the db.** `db-server.mjs` shuts Postgres down on SIGINT/SIGTERM, which Windows doesn't
  really deliver. After a hard stop you may get `lock file "postmaster.pid" already exists`
  (Kais saw this exact error on the Mac when he started a second copy). Fix: check Task Manager
  for a leftover `postgres.exe`, end it, delete `.pgdata/postmaster.pid`, start again.
  Never run two db servers against the same `.pgdata`.
- **Fallback if local Postgres won't cooperate:** create a free **Supabase** project (EU region),
  put its *direct* connection string (port 5432) in `DATABASE_URL`, then migrate + seed. That is
  the planned production database anyway — but use a separate dev project, since the seed wipes data.
- **`.claude/launch.json`** uses `node` from PATH and paths relative to the repo root, so it only
  works when Claude Code is opened *in the repo folder*.
- Long paths: `git config --global core.longpaths true` avoids issues with deep `node_modules`.

---

## 7. History — how we got here

**2026-06-17 · Phase 1 (step by step).** Kais sent the brief and asked for questions before any
code. Asked three questions → Auth.js over Clerk, Supabase for the database, step-by-step pace.
The Mac had no Node at all → installed nvm + Node 24.16.0 and created `~/.zshrc`.
`create-next-app` rejected the folder name `Reverse linkedin` (space + capitals aren't valid npm
names), so it was scaffolded into a temp folder and moved to the root. First routing attempt
used route groups for both roles → caught the `/messages` collision → switched to literal
`/candidate` and `/company`. Commit `b1ce996`.

**2026-07-05 · Full MVP ("full frihet").** Kais switched to Claude Fable 5 and granted full
freedom to build the most impressive version. `prisma dev` failed with P1017 even though a
plain `pg` client connected → replaced with `embedded-postgres`. Then auth, candidate app,
company app — one commit each. Scripted HTTP tests caught the `ORDER BY 0` bug in empty
searches → fixed and re-verified (exactly 9 LOOKING shown, 3 EMPLOYED hidden). README written.
Dev servers were set up via `.claude/launch.json` + preview.

**The terminal incident.** Kais copied the README run commands — *including the `# terminal 1`
comments* — into one terminal. npm passed the comment text to `next dev` as a folder path, and
`db:dev` failed because the preview tool's db was already running on the same data folder.
Lesson (now in his global instructions): **use preview tools, never manual terminal steps.**

**2026-07-06 · Wave 2.** Kais asked for more filters, gender/age, CV upload, LinkedIn import,
and full legal compliance. Two questions → CV parsing via the Claude API, build everything.
Built lawful filters, mutual connections, the GDPR package and CV import. A generated test CV
revealed that PDF text extraction lost all line breaks → rebuilt lines from text-fragment Y
coordinates. Seed gained universities so filters demo well. Commits `4650316` … `4f33b07`.

**2026-07-18 · Kimi review package.** A review folder for the Kimi AI was created on the Mac at
`/Users/Kais/Reverse linkedin - Kimi review/` (`BRIEF_FOR_KIMI.md` + source copy). No Kimi
feedback was ever brought back. That brief had two factual errors, corrected here: the schema
has **16** models (not 13), and there is **no** `Message.readAt` field.

**2026-09-26 · Handoff.** Exams (Aug 20–28) are over; project work resumes on the PC.

---

## 8. Known weaknesses

Ranked roughly by how much they matter before real users.

1. **Paid access isn't enforced.** Any company account — even CANCELED — can search and message.
   Billing is UI only. There is no trial end date in the schema. (Blocks monetization.)
2. **No rate limiting or lockout** on sign-in, sign-up or outreach.
3. **No email verification, no password reset.** Needs an email provider (e.g. Resend).
4. **Privacy policy has a placeholder contact** (`privacy@reverse.example`) and names no data
   controller. No terms of service. (Blocks a real launch.)
5. **Search won't scale:** the full-text document is computed per row per query, including
   subqueries over experiences/educations. Needs a generated/maintained `tsvector` + GIN index.
6. **No pagination** anywhere (feed takes 50, search 30); the connections page loads all
   candidates and all accepted connections into memory.
7. **Messaging:** no realtime, no unread state (would need a new field), no notifications.
8. **Offers can't be answered:** `JobOffer` has no status (accepted/declined).
9. **One user per company** (`Company.ownerId` unique); `seats` isn't used.
10. **bcryptjs cost 10** (pure JS). Argon2id would be stronger for a real launch.
11. **No automated tests or CI** — verification was scripted during development.
12. **CV import:** heuristic parser is fragile on unusual layouts; scanned-image PDFs unsupported;
    the Claude path needs `ANTHROPIC_API_KEY`.
13. **UX debt:** comments always expanded, no optimistic UI, `<details>` for disclosure,
    initials-only avatars (no photos is deliberate). Accessibility never audited.
14. **Cleanup:** `pg` devDependency (debug leftover) and `src/types/index.ts` (`SessionUser`)
    are unused.
15. **Global feed** — shows everyone's posts, not your network's.

---

## 9. Suggested next steps

In order. Confirm with Kais before starting each block; he often says "kör på" / grants full freedom.

**0. First session on the PC** — setup + screenshot (§6). Then offer to create a **private**
GitHub repo and push (needs his OK and his GitHub login) — it's the backup and the way to sync
Mac ↔ PC.

**1. Monetization: Stripe (test mode only)**
- Stripe Checkout for a per-seat subscription; a webhook route that sets
  `Company.subscriptionStatus` and `stripeCustomerId`.
- Add a trial end date to `Company`, then **gate** `/company/search`, `/company/candidates/[id]`
  and outreach server-side for anything not ACTIVE or in-trial.
- Billing page: real plan buttons + Stripe customer portal link.

**2. Hardening before any real user**
- Rate limiting (sign-in, sign-up, outreach), email verification, password reset.
- `tsvector` + GIN index for search; pagination.
- Real privacy policy contact + data controller, a terms-of-service page.
- Remove dead code (item 14 above).

**3. Deploy (Vercel + Supabase, EU region)**
- Add `directUrl = env("DIRECT_URL")` to the Prisma datasource (Supabase: pooled 6543 for the
  app, direct 5432 for migrations) and a `"postinstall": "prisma generate"` script.
- Vercel env vars: `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, optional `ANTHROPIC_API_KEY`,
  Stripe keys. Check whether Auth.js needs `AUTH_TRUST_HOST`/`AUTH_URL` there.
- `prisma migrate deploy` in production. **Never seed production.**
- `embedded-postgres` is dev-only — nothing to deploy.

**4. Product ideas (suggestions, not decided)**
- Candidates accept/decline offers (status on `JobOffer`).
- Lawful, useful candidate fields: salary expectation, availability date, preferred roles.
- Recruiter tools: saved searches, shortlists, notes on candidates.
- Unread badges + email notifications; network-scoped feed; team seats.

---

## 10. Working with Kais

- **Swedish** in chat (casual, energetic); English in code, comments, commits, docs.
- **Narrate as you go** — his words: *"säg till vad du gör så att jag hänger med."* One line of
  why, then do it.
- Default is **step by step with check-ins**. When he says **"full frihet"**, decide and build
  the impressive version, then give a walkthrough afterwards.
- **Aesthetics are a requirement.** Professional, clean, pleasing.
- **Be honest about limits** — flag stubs, estimates and anything unverified.
- **Dev servers only via `preview_start`** + `.claude/launch.json` (db first, then web). Verify
  with logs and a **screenshot** before claiming anything runs.
- **Commit per milestone** with a clear English message; keep the README current.
- He also has a global `CLAUDE.md` and skills (study coaching, dev servers, launch runbooks) —
  the handoff zip contains copies in `claude-config/`. Its dated notes (August 2026 exam
  period) are history now.
