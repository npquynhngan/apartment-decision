-- apartment-decision: add bedrooms and bathrooms to apartments
-- Both columns are optional (nullable) — the user may not know these
-- values during early research.

alter table public.apartments
  add column if not exists bedrooms integer,
  add column if not exists bathrooms integer;
