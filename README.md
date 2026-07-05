# Reverse — the talent marketplace where companies apply to you

Reverse flips the logic of LinkedIn and traditional job ads: **individuals build a
profile for free and companies pay to reach them**. Flip your status to
*Looking for work* and recruiters come to you — with salary, role and hours up
front.

## Features

**For candidates (free)**
- Rich profile: experience, education, projects, skills, certifications
- *Looking for work / Employed* toggle — employed users are invisible to companies
- Social layer: feed with posts, likes and comments; connection requests; direct messages

**For companies (subscription)**
- Full-text candidate search (Postgres `tsvector`, `websearch_to_tsquery` + `ts_rank`)
  with skill and location filters — only over candidates who are actively looking
- Candidate detail view + direct outreach with **structured job offers**
  (title, salary range, hours/week, location) rendered as offer cards in the thread
- Dashboard with live market stats; billing page with subscription state (Stripe-ready)

## Tech stack

| Layer      | Choice                                                        |
| ---------- | ------------------------------------------------------------- |
| Framework  | Next.js 16 (App Router, Server Components, Server Actions)    |
| Language   | TypeScript end to end                                          |
| Database   | PostgreSQL — embedded locally, Supabase in production          |
| ORM        | Prisma (migrations, typed queries, raw SQL for FTS)           |
| Auth       | Auth.js v5 (credentials + bcrypt, JWT sessions with role)     |
| Styling    | Tailwind CSS v4, hand-rolled component kit                    |
| Validation | Zod on every server action                                    |
| Payments   | Stripe (planned — data model in place)                        |

## Getting started

```bash
npm install
cp .env.example .env         # then set AUTH_SECRET (openssl rand -base64 33)

npm run db:dev               # terminal 1 — local Postgres (no Docker/install needed)
npx prisma migrate dev       # terminal 2 — create schema
npm run db:seed              #             demo data
npm run dev                  #             app on http://localhost:3000
```

**Demo logins** (password `Passw0rd!`):

| Role      | Email             |
| --------- | ----------------- |
| Candidate | `anna@demo.se`    |
| Company   | `talent@acme.se`  |

## Scripts

| Script               | What it does                                  |
| -------------------- | --------------------------------------------- |
| `npm run dev`        | Next.js dev server                            |
| `npm run db:dev`     | Local Postgres (embedded, data in `.pgdata/`) |
| `npm run db:migrate` | Prisma migrations                             |
| `npm run db:seed`    | Reset + seed demo data                        |
| `npm run db:studio`  | Prisma Studio (DB GUI)                        |
| `npm run build`      | Production build                              |

## Architecture notes

- **URL split:** `/candidate/*` and `/company/*` are separate route subtrees with
  their own layout guards (`requireCandidate` / `requireCompany`). Route groups
  weren't used here on purpose — both worlds need e.g. `/messages`, and groups
  collapse to the same URL.
- **Authorization in the data layer:** every server action re-checks the session,
  and ownership/participation is part of the query itself (`deleteMany({ id, profileId })`,
  participant checks in `lib/messaging.ts`) — not just the UI.
- **Search** (`lib/search.ts`): one composable SQL fragment defines the searchable
  document, used for both matching and ranking so they can't drift apart.
  `websearch_to_tsquery` gives Google-style syntax (`react "design systems" -java`).
- **Employed = hidden** is enforced in the search SQL and again on the candidate
  detail page — not something the UI merely hides.

## Roadmap

- [x] Phase 1 — project structure & routing
- [x] Phase 2 — data model (Prisma + Postgres)
- [x] Phase 3 — auth with dual account types
- [x] Phase 4 — company search (Postgres FTS)
- [x] Phase 5 — messaging & structured offers
- [x] Phase 6 — social feed
- [ ] Stripe subscriptions (checkout + webhooks + gating)
- [ ] Deploy: Vercel + Supabase
