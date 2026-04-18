-- apartment-decision: enable realtime replication on the tables
-- we want partners to see live updates on.
--
-- Supabase exposes a logical-replication publication named
-- supabase_realtime. Adding a table publishes INSERT/UPDATE/DELETE
-- events to the realtime service.

alter publication supabase_realtime add table public.criteria;
alter publication supabase_realtime add table public.apartments;
alter publication supabase_realtime add table public.scores;
alter publication supabase_realtime add table public.reminders;
alter publication supabase_realtime add table public.photos;

-- REPLICA IDENTITY FULL lets UPDATE/DELETE events include the full old
-- row, which the client subscriptions in later steps rely on to diff
-- scoring changes.
alter table public.criteria   replica identity full;
alter table public.apartments replica identity full;
alter table public.scores     replica identity full;
alter table public.reminders  replica identity full;
alter table public.photos     replica identity full;
