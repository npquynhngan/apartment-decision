# Supabase setup

The app uses Supabase (Postgres + auth + RLS + realtime + storage) on the
free tier. No local Supabase CLI is required — run the SQL files in this
folder directly via the SQL editor in the Supabase dashboard.

## One-time setup

1. Create a new project at <https://supabase.com/dashboard>.
2. In the SQL editor, run the files in `supabase/migrations/` **in order**:

   | Step | File | What it does |
   | --- | --- | --- |
   | 1 | `0001_initial_schema.sql` | Tables, indexes, and helper functions (`current_household_id`, `generate_invite_code`). |
   | 2 | `0002_rls_policies.sql` | Enables RLS on every table and adds household-scoped policies. |
   | 3 | `0003_apartment_scores_view.sql` | Creates the `apartment_scores` view with `security_invoker = true`. |
   | 4 | `0004_realtime.sql` | Adds tables to the `supabase_realtime` publication and sets `REPLICA IDENTITY FULL`. |

3. Grab your project's **URL** and **anon key** from
   Project Settings → API, then set them in `.env.local`:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
   ```

4. Under Authentication → Providers, confirm **Email** (magic link) is
   enabled. Step 3 wires up the client.

## Schema overview

- `households(id, name, invite_code)` — a pair of partners.
- `users(id, email, household_id, display_name, user_slot, home/work address + coords)` —
  1:1 with `auth.users`; `user_slot` is `'a'` or `'b'`, unique within a household.
- `criteria(..., weight_a, weight_b, is_dealbreaker, position, auto_source)` —
  the dimensions being scored; each partner has their own weight.
- `apartments(..., scrape_data jsonb)` — listings being evaluated.
- `scores(apartment_id, criterion_id, user_slot, value, auto, needs_review)` —
  composite PK, one row per (apartment, criterion, user_slot).
- `reminders`, `photos` — as named.

## `apartment_scores` view

Returns one row per apartment with:

- `score_a`, `score_b` — each partner's normalized score in `[0, 1]`, or
  `NULL` if that partner hasn't scored anything.
- `combined_score` — average of the two, or whichever is present if only
  one has scored.
- `dealbreaker_failed` — `true` if any dealbreaker criterion has a score
  `<= 1` from either partner.
- `effective_score` — `0` when `dealbreaker_failed`, else `combined_score`.

The view uses `security_invoker = true` so RLS on the underlying tables
applies — a user only sees apartments from their own household.

## RLS summary

| Table | SELECT | INSERT | UPDATE / DELETE |
| --- | --- | --- | --- |
| `households` | members only | any authenticated user | members only |
| `users` | self + household members | self | self only |
| `criteria`, `apartments`, `reminders` | household members | household members | household members |
| `scores`, `photos` | household members (via apartment join) | household members | household members |

Joining an existing household via invite code is done by a SECURITY
DEFINER RPC added in step 3, so the browser never needs a privileged
policy on `households`.
