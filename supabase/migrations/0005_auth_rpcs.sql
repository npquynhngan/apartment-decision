-- apartment-decision: auth RPCs and user-profile trigger

-- -------------------------------------------------------------------
-- Auto-create public.users profile row on first sign-in
-- -------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -------------------------------------------------------------------
-- create_household(p_name, p_slot)
-- Creates a new household and assigns the calling user to it.
-- Returns the new household id.
-- -------------------------------------------------------------------

create or replace function public.create_household(p_name text, p_slot text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_household_id uuid;
begin
  if p_slot not in ('a', 'b') then
    raise exception 'invalid slot: must be "a" or "b"';
  end if;

  insert into public.households (name)
  values (p_name)
  returning id into v_household_id;

  update public.users
  set household_id = v_household_id,
      user_slot    = p_slot
  where id = auth.uid();

  return v_household_id;
end;
$$;

revoke all on function public.create_household(text, text) from public;
grant execute on function public.create_household(text, text) to authenticated;

-- -------------------------------------------------------------------
-- join_household(p_invite_code, p_slot)
-- Joins an existing household via its invite code.
-- Returns the household id.
-- -------------------------------------------------------------------

create or replace function public.join_household(p_invite_code text, p_slot text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_household_id uuid;
begin
  if p_slot not in ('a', 'b') then
    raise exception 'invalid slot: must be "a" or "b"';
  end if;

  select id into v_household_id
  from public.households
  where invite_code = upper(trim(p_invite_code));

  if v_household_id is null then
    raise exception 'invite code not found';
  end if;

  -- Slot must be free (another user can''t already hold it)
  if exists (
    select 1 from public.users
    where household_id = v_household_id
      and user_slot    = p_slot
      and id          <> auth.uid()
  ) then
    raise exception 'slot % is already taken in this household', p_slot;
  end if;

  update public.users
  set household_id = v_household_id,
      user_slot    = p_slot
  where id = auth.uid();

  return v_household_id;
end;
$$;

revoke all on function public.join_household(text, text) from public;
grant execute on function public.join_household(text, text) to authenticated;
