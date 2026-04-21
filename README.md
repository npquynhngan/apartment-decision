# apartment-decision

A collaborative Next.js app for two people comparing apartments. Each partner
scores listings across weighted criteria (with dealbreaker toggles), commute
proximity is auto-scored from straight-line distance to home/work, and an
Anthropic-powered analyzer summarizes per-apartment pros, cons, and things to
verify. All services run on free tiers.

## Stack

- **Framework:** Next.js 15 (App Router, Server Components by default) +
  TypeScript + Tailwind v4 + [shadcn/ui](https://ui.shadcn.com).
- **Backend:** Supabase (Postgres + RLS + auth).
- **Map:** Leaflet + OpenStreetMap tiles + Nominatim (1 req/sec).
- **Commute auto-score:** Haversine great-circle distance (no paid routing API).
- **LLM:** Anthropic API, model `claude-opus-4-7`.
- **Deploy:** Vercel Hobby.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev
```

Open <http://localhost:3000>.

## Environment variables

Every secret is read from env — nothing is hardcoded. See
[`.env.example`](./.env.example) for the full list; the variables are:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (public). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key for the browser client. |
| `ANTHROPIC_API_KEY` | Anthropic API key for the per-apartment AI analysis. Optional — the feature degrades gracefully when unset. |
| `NEXT_PUBLIC_APP_URL` | Public base URL, e.g. `http://localhost:3000` locally or `https://your-app.vercel.app` in production. Used for magic-link redirects. |

## Build order

All 12 steps shipped:

- [x] 1. Scaffold, GitHub, Vercel deploy.
- [x] 2. Supabase schema + RLS + `apartment_scores` view.
- [x] 3. Magic-link + password auth, household create/join, user_slot assignment.
- [x] 4. Criteria CRUD with dual weight sliders + dealbreaker toggle.
- [x] 5. Apartment CRUD + Nominatim geocoding + scoring matrix (+ tests).
- [x] 6. Ranking dashboard reading from `apartment_scores`.
- [x] 7. Leaflet map with geocoded pins.
- [x] 8. Viewings page grouping upcoming/past.
- [x] 9. In-app reminders (overdue/upcoming/done sections).
- [x] 10. Listing scraper with OpenGraph/JSON-LD parsing (+ tests).
- [x] 11. Commute auto-score via Haversine distance from home/work addresses.
- [x] 12. Per-apartment AI analysis via Claude (summary + pros/cons/verify).

## Deploy

Deployed on Vercel Hobby. One-time setup:

1. In the Vercel dashboard, "Add New… → Project" and import the GitHub
   repo `npquynhngan/apartment-decision`.
2. Framework preset: **Next.js** (auto-detected).
3. Add the environment variables from [`.env.example`](./.env.example) to
   the Vercel project (Production + Preview). Leave `NEXT_PUBLIC_APP_URL`
   empty until you have your production URL, then fill it in and redeploy.
4. In Supabase **Authentication → URL Configuration**, set the Site URL to
   your Vercel URL and add `https://your-app.vercel.app/auth/callback` to
   the redirect URL allow-list.

Once connected, every push to `main` goes to production, every push to
another branch gets a preview URL.

## Database

Supabase SQL migrations live in [`supabase/migrations/`](./supabase/migrations).
Run them in order in the Supabase SQL editor — see
[`supabase/README.md`](./supabase/README.md) for details. Schema setup
needs only dashboard access; the app never uses the service-role key.

## Scripts

```bash
npm run dev     # start dev server
npm run build   # production build
npm run start   # serve the production build
npm run lint    # eslint
npx vitest run  # unit tests (scoring, scrape, commute)
```
