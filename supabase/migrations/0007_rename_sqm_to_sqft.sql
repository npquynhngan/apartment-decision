-- Rent is quoted in SGD and area in square feet (Singapore norms).
-- Rename apartments.sqm → apartments.sqft to match UI labels.
alter table public.apartments rename column sqm to sqft;
