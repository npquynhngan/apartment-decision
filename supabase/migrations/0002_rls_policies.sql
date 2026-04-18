-- apartment-decision: RLS policies
-- Every table is readable/writable only by members of the same household.
-- Exceptions:
--   - A user may always read/update/insert their own public.users row.
--   - households.INSERT is open to any authenticated user (so a new user
--     can create their household); households.SELECT is restricted to
--     members. Joining via invite_code goes through the RPC added in
--     step 3 (SECURITY DEFINER).

alter table public.households enable row level security;
alter table public.users      enable row level security;
alter table public.criteria   enable row level security;
alter table public.apartments enable row level security;
alter table public.scores     enable row level security;
alter table public.reminders  enable row level security;
alter table public.photos     enable row level security;

-- -------------------------------------------------------------------
-- households
-- -------------------------------------------------------------------

drop policy if exists households_select_own on public.households;
create policy households_select_own on public.households
  for select to authenticated
  using (id = public.current_household_id());

drop policy if exists households_insert_auth on public.households;
create policy households_insert_auth on public.households
  for insert to authenticated
  with check (true);

drop policy if exists households_update_own on public.households;
create policy households_update_own on public.households
  for update to authenticated
  using (id = public.current_household_id())
  with check (id = public.current_household_id());

drop policy if exists households_delete_own on public.households;
create policy households_delete_own on public.households
  for delete to authenticated
  using (id = public.current_household_id());

-- -------------------------------------------------------------------
-- users
-- -------------------------------------------------------------------

drop policy if exists users_select_self_or_household on public.users;
create policy users_select_self_or_household on public.users
  for select to authenticated
  using (
    id = auth.uid()
    or (household_id is not null and household_id = public.current_household_id())
  );

drop policy if exists users_insert_self on public.users;
create policy users_insert_self on public.users
  for insert to authenticated
  with check (id = auth.uid());

drop policy if exists users_update_self on public.users;
create policy users_update_self on public.users
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists users_delete_self on public.users;
create policy users_delete_self on public.users
  for delete to authenticated
  using (id = auth.uid());

-- -------------------------------------------------------------------
-- criteria / apartments / reminders — scoped by household_id directly
-- -------------------------------------------------------------------

drop policy if exists criteria_all_household on public.criteria;
create policy criteria_all_household on public.criteria
  for all to authenticated
  using (household_id = public.current_household_id())
  with check (household_id = public.current_household_id());

drop policy if exists apartments_all_household on public.apartments;
create policy apartments_all_household on public.apartments
  for all to authenticated
  using (household_id = public.current_household_id())
  with check (household_id = public.current_household_id());

drop policy if exists reminders_all_household on public.reminders;
create policy reminders_all_household on public.reminders
  for all to authenticated
  using (household_id = public.current_household_id())
  with check (household_id = public.current_household_id());

-- -------------------------------------------------------------------
-- scores / photos — scoped by apartment.household_id
-- -------------------------------------------------------------------

drop policy if exists scores_all_household on public.scores;
create policy scores_all_household on public.scores
  for all to authenticated
  using (
    exists (
      select 1 from public.apartments a
      where a.id = scores.apartment_id
        and a.household_id = public.current_household_id()
    )
  )
  with check (
    exists (
      select 1 from public.apartments a
      where a.id = scores.apartment_id
        and a.household_id = public.current_household_id()
    )
  );

drop policy if exists photos_all_household on public.photos;
create policy photos_all_household on public.photos
  for all to authenticated
  using (
    exists (
      select 1 from public.apartments a
      where a.id = photos.apartment_id
        and a.household_id = public.current_household_id()
    )
  )
  with check (
    exists (
      select 1 from public.apartments a
      where a.id = photos.apartment_id
        and a.household_id = public.current_household_id()
    )
  );
