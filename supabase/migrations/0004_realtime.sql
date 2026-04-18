-- apartment-decision: enable realtime replication on the tables
-- we want partners to see live updates on.
--
-- Supabase may have already added these tables to supabase_realtime
-- automatically. Each ALTER PUBLICATION is wrapped in a DO block so
-- the migration is idempotent — duplicate_object errors are swallowed.

do $$ begin
  alter publication supabase_realtime add table public.criteria;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table public.apartments;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table public.scores;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table public.reminders;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table public.photos;
exception when duplicate_object then null;
end $$;

-- REPLICA IDENTITY FULL lets UPDATE/DELETE events include the full old
-- row, which the client subscriptions in later steps rely on to diff
-- scoring changes.
alter table public.criteria   replica identity full;
alter table public.apartments replica identity full;
alter table public.scores     replica identity full;
alter table public.reminders  replica identity full;
alter table public.photos     replica identity full;
