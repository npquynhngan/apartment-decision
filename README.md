# apartment-decision

A collaborative Next.js app for two people comparing apartments. Each partner
scores listings across weighted criteria (with dealbreaker toggles),
commute times are auto-scored via OpenRouteService, and an Anthropic-powered
analyzer summarizes the top tradeoffs. All services run on free tiers.

## Stack

- **Framework:** Next.js 15 (App Router, Server Components by default) +
  TypeScript + Tailwind v4 + [shadcn/ui](https://ui.shadcn.com).
- **Backend:** Supabase (Postgres + RLS + auth + realtime + storage).
- **Map:** Leaflet + OpenStreetMap tiles + Nominatim (1 req/sec).
- **Routing:** OpenRouteService.
- **LLM:** Anthropic API, model `claude-sonnet-4-5`.
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

| Variable | Used in step | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | 2+ | Supabase project URL (public). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 2+ | Supabase anon key for the browser client. |
| `SUPABASE_SERVICE_ROLE_KEY` | 2+ | Service-role key for server-only admin work. Never expose client-side. |
| `OPENROUTESERVICE_API_KEY` | 11 | Free-tier ORS API key for commute routing. |
| `ANTHROPIC_API_KEY` | 12 | Anthropic API key for the LLM analyze/summarize routes. |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | 9 (optional) | Public VAPID key for browser Push Notifications. |
| `VAPID_PRIVATE_KEY` | 9 (optional) | Private VAPID key (server only). |
| `NEXT_PUBLIC_APP_URL` | all | Public base URL, e.g. `http://localhost:3000`. |

## Build order

The project is built incrementally. The current commit covers:

- [x] 1. Scaffold, GitHub, Vercel deploy.
- [ ] 2. Supabase schema + RLS + `apartment_scores` view.
- [ ] 3. Magic-link auth, household create/join, user_slot assignment.
- [ ] 4. Criteria CRUD with dual weight sliders + dealbreaker toggle.
- [ ] 5. Apartment CRUD + Nominatim geocoding + scoring matrix (+ tests).
- [ ] 6. Ranking dashboard reading from `apartment_scores`.
- [ ] 7. Leaflet map with score-colored pins + regional averages.
- [ ] 8. Viewings schedule + `.ics` export.
- [ ] 9. In-app reminders + browser Push Notifications.
- [ ] 10. `/api/scrape` listing importer + parsers (+ tests).
- [ ] 11. Commute auto-score via OpenRouteService.
- [ ] 12. `/api/analyze` LLM routes (summarize + analyze-photos).

## Deploy

Deployed on Vercel Hobby. One-time setup:

1. In the Vercel dashboard, "Add New… → Project" and import the GitHub
   repo `npquynhngan/apartment-decision`.
2. Framework preset: **Next.js** (auto-detected).
3. Add the environment variables from [`.env.example`](./.env.example) to
   the Vercel project (Production + Preview).

Once connected, Vercel auto-deploys: every push to `main` goes to
production, every push to any other branch gets a preview URL. No CLI
needed — the GitHub → Vercel integration handles it.

## Database

Supabase SQL migrations live in [`supabase/migrations/`](./supabase/migrations).
Run them in order in the Supabase SQL editor — see
[`supabase/README.md`](./supabase/README.md) for details. Schema setup
needs only dashboard access; the app never uses the service-role key
from the browser.

## Scripts

```bash
npm run dev     # start dev server
npm run build   # production build
npm run start   # serve the production build
npm run lint    # eslint
```
