<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Reverse — context for agents

A *reversed LinkedIn*: individuals build profiles for free and toggle "Looking for work";
companies pay to search them and reach out with structured offers (title, salary, hours).
Plus a social layer (feed, connections, messages). Owner: Kais — MSc student, portfolio +
monetization project.

**New machine or first session? Read `HANDOFF.md` in full first** — vision, history,
architecture, PC setup, known weaknesses and next steps. It replaces the old conversation.

## Decided — don't reopen
- **No gender/age/photo fields or filters anywhere** (diskrimineringslagen 2008:567 + GDPR).
- **"Employed = hidden" is enforced in SQL** (`src/lib/search.ts`) and re-checked on the
  candidate detail page — never only in the UI.
- **`/candidate/*` and `/company/*` are literal route segments**, not route groups.
- **Authorization lives in the data layer:** every server action calls `requireCandidate()` /
  `requireCompany()`, and ownership is part of the query.
- **No LinkedIn scraping** — CV upload (review-first, text-only to the AI) instead.
- Stack: Next.js 16 · TypeScript · Prisma 6 + PostgreSQL (`embedded-postgres` locally,
  Supabase planned) · Auth.js v5 (credentials, JWT with id+role) · Tailwind v4 · Zod v4.

## Run
- Dev servers **only via `preview_start`** from `.claude/launch.json`: start `db` (Postgres on
  5433) **before** `web`. Never tell Kais to run terminal commands himself.
- First time: `npm install`, `.env` from `.env.example` (+ `AUTH_SECRET`),
  `npx prisma generate`, start `db`, `npx prisma migrate deploy`, `npm run db:seed`.
- Demo logins, password `Passw0rd!`: `anna@demo.se` (candidate), `talent@acme.se` (company).
- `npm run db:seed` **wipes all data** — never against production.
- Verify with `npm run build` and a preview screenshot before claiming anything works.

## State (2026-09-26)
MVP + Wave 2 done: auth, candidate app, company app, full-text search with lawful filters,
offers, feed, GDPR export/delete, CV import. **Next:** Stripe + paid-access gating, hardening
(rate limits, email verification, password reset), deploy (Vercel + Supabase EU).

## Working with Kais
Chat in **Swedish**; code/comments/commits in English. Narrate what you do and why
("säg till vad du gör så att jag hänger med"). Step by step by default; when he grants
"full frihet", build the impressive version and walk him through it after. Aesthetics
matter. Be honest about anything stubbed or unverified. Commit per milestone.
