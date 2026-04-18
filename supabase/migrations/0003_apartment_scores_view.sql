-- apartment-decision: apartment_scores view
--
-- Per-apartment, per-user weighted scores with a combined score,
-- a dealbreaker flag, and an "effective" score that collapses to 0
-- when any dealbreaker criterion was rated 1 (by either partner).
--
-- Normalization:
--   For each (apartment, user_slot) we compute
--     weighted_sum = SUM(weight_slot * value)
--     max_possible = SUM(weight_slot * 5)
--   and return weighted_sum / max_possible in [0, 1], or NULL if the
--   user has not scored any criterion for that apartment (or all their
--   relevant weights are zero).
--
-- combined_score:
--   Average of the two normalized scores. If only one partner has
--   scored anything, that partner's score is used. NULL if neither.
--
-- dealbreaker_failed:
--   TRUE if any score for a criterion with is_dealbreaker=true is <= 1,
--   from either partner.
--
-- effective_score:
--   0 when dealbreaker_failed, else combined_score. Intended to be the
--   ranking value.
--
-- security_invoker=true means this view respects the RLS policies on
-- apartments / scores / criteria — callers only see rows from their own
-- household even though the view itself is in the public schema.

drop view if exists public.apartment_scores;

create view public.apartment_scores
with (security_invoker = true)
as
with per_user as (
  select
    s.apartment_id,
    s.user_slot,
    sum(
      case s.user_slot
        when 'a' then c.weight_a
        when 'b' then c.weight_b
      end * s.value
    )::numeric as weighted_sum,
    sum(
      case s.user_slot
        when 'a' then c.weight_a
        when 'b' then c.weight_b
      end * 5
    )::numeric as max_possible
  from public.scores s
  join public.criteria c on c.id = s.criterion_id
  group by s.apartment_id, s.user_slot
),
normalized as (
  select
    apartment_id,
    user_slot,
    case when max_possible > 0 then weighted_sum / max_possible end as score
  from per_user
),
per_apartment as (
  select
    apartment_id,
    max(case when user_slot = 'a' then score end) as score_a,
    max(case when user_slot = 'b' then score end) as score_b
  from normalized
  group by apartment_id
),
dealbreakers as (
  select
    s.apartment_id,
    bool_or(c.is_dealbreaker and s.value <= 1) as dealbreaker_failed
  from public.scores s
  join public.criteria c on c.id = s.criterion_id
  group by s.apartment_id
),
combined as (
  select
    a.id as apartment_id,
    a.household_id,
    p.score_a,
    p.score_b,
    case
      when p.score_a is null and p.score_b is null then null
      when p.score_a is null then p.score_b
      when p.score_b is null then p.score_a
      else (p.score_a + p.score_b) / 2
    end as combined_score,
    coalesce(d.dealbreaker_failed, false) as dealbreaker_failed
  from public.apartments a
  left join per_apartment p on p.apartment_id = a.id
  left join dealbreakers d on d.apartment_id = a.id
)
select
  apartment_id,
  household_id,
  score_a,
  score_b,
  combined_score,
  dealbreaker_failed,
  case when dealbreaker_failed then 0::numeric else combined_score end
    as effective_score
from combined;

grant select on public.apartment_scores to authenticated;
