-- apartment-decision: initial schema
-- All domain tables are scoped by household_id. RLS is added in 0002.

create extension if not exists pgcrypto;

-- -------------------------------------------------------------------
-- Helpers
-- -------------------------------------------------------------------

-- Short, human-friendly invite code. 8 hex chars uppercased.
create or replace function public.generate_invite_code()
returns text
language sql
volatile
as $$
  select upper(substring(encode(gen_random_bytes(6), 'hex') from 1 for 8));
$$;

-- -------------------------------------------------------------------
-- Tables
-- -------------------------------------------------------------------

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique default public.generate_invite_code(),
  created_at timestamptz not null default now()
);

-- Public profile table, 1:1 with auth.users. user_slot is 'a' or 'b'
-- within a household; a household has at most one of each slot.
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  household_id uuid references public.households(id) on delete set null,
  display_name text,
  user_slot text check (user_slot in ('a', 'b')),
  home_address text,
  work_address text,
  home_coords jsonb,
  work_coords jsonb,
  created_at timestamptz not null default now()
);

-- At most one of each slot per household. Partial unique index so users
-- who have not yet joined a household (household_id is null) don't clash.
create unique index if not exists ux_users_household_slot
  on public.users (household_id, user_slot)
  where household_id is not null and user_slot is not null;

create index if not exists ix_users_household on public.users (household_id);

create table if not exists public.criteria (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  category text not null,
  name text not null,
  weight_a integer not null default 5 check (weight_a between 0 and 10),
  weight_b integer not null default 5 check (weight_b between 0 and 10),
  is_dealbreaker boolean not null default false,
  position integer not null default 0,
  auto_source text,
  created_at timestamptz not null default now()
);

create index if not exists ix_criteria_household_position
  on public.criteria (household_id, position);

create table if not exists public.apartments (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  address text,
  lat double precision,
  lng double precision,
  rent numeric,
  url text,
  notes text,
  viewing_at timestamptz,
  sqm numeric,
  scrape_data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ix_apartments_household
  on public.apartments (household_id);

-- Composite PK: one score per (apartment, criterion, user_slot). No
-- separate id column — the natural key is exactly what a partner edit
-- upserts against.
create table if not exists public.scores (
  apartment_id uuid not null references public.apartments(id) on delete cascade,
  criterion_id uuid not null references public.criteria(id) on delete cascade,
  user_slot text not null check (user_slot in ('a', 'b')),
  value integer not null check (value between 1 and 5),
  auto boolean not null default false,
  needs_review boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (apartment_id, criterion_id, user_slot)
);

create index if not exists ix_scores_apartment on public.scores (apartment_id);
create index if not exists ix_scores_criterion on public.scores (criterion_id);

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  apartment_id uuid references public.apartments(id) on delete set null,
  text text not null,
  due_at timestamptz not null,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists ix_reminders_household_due
  on public.reminders (household_id, due_at);

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  apartment_id uuid not null references public.apartments(id) on delete cascade,
  url text not null,
  analysis jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ix_photos_apartment on public.photos (apartment_id);

-- -------------------------------------------------------------------
-- current_household_id() — defined AFTER public.users exists
-- -------------------------------------------------------------------

-- Returns the household_id of the currently authenticated user. Used
-- by RLS policies. SECURITY DEFINER so the function body can read
-- public.users without triggering the policy on that same table.
create or replace function public.current_household_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select household_id from public.users where id = auth.uid();
$$;

revoke all on function public.current_household_id() from public;
grant execute on function public.current_household_id() to authenticated;
