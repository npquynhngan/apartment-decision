-- Replace gen_random_bytes (pgcrypto, wrong schema in Supabase) with
-- gen_random_uuid() which is built into Postgres 13+ and needs no extension.
create or replace function public.generate_invite_code()
returns text
language sql
volatile
as $$
  select upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8));
$$;
