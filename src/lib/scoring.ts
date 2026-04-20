// Pure TypeScript mirror of the apartment_scores view (0003_apartment_scores_view.sql).
// Used for client-side optimistic score updates and for unit tests that
// don't require a live database.
//
// Scores are integers 1-5 (per the CHECK constraint on public.scores.value).
// Weights are integers 0-10. A dealbreaker criterion fails if either partner
// rated it <= 1.

export type UserSlot = "a" | "b";

export type CriterionInput = {
  id: string;
  weight_a: number;
  weight_b: number;
  is_dealbreaker: boolean;
};

export type ScoreInput = {
  criterion_id: string;
  user_slot: UserSlot;
  value: number;
};

export type ApartmentScore = {
  score_a: number | null;
  score_b: number | null;
  combined_score: number | null;
  dealbreaker_failed: boolean;
  effective_score: number | null;
};

export function computeApartmentScore(
  criteria: CriterionInput[],
  scores: ScoreInput[]
): ApartmentScore {
  const criteriaById = new Map(criteria.map((c) => [c.id, c]));

  let weightedSumA = 0;
  let maxPossibleA = 0;
  let weightedSumB = 0;
  let maxPossibleB = 0;
  let dealbreakerFailed = false;

  for (const s of scores) {
    const c = criteriaById.get(s.criterion_id);
    if (!c) continue;

    const weight = s.user_slot === "a" ? c.weight_a : c.weight_b;

    if (s.user_slot === "a") {
      weightedSumA += weight * s.value;
      maxPossibleA += weight * 5;
    } else {
      weightedSumB += weight * s.value;
      maxPossibleB += weight * 5;
    }

    if (c.is_dealbreaker && s.value <= 1) {
      dealbreakerFailed = true;
    }
  }

  const score_a = maxPossibleA > 0 ? weightedSumA / maxPossibleA : null;
  const score_b = maxPossibleB > 0 ? weightedSumB / maxPossibleB : null;

  let combined_score: number | null;
  if (score_a === null && score_b === null) combined_score = null;
  else if (score_a === null) combined_score = score_b;
  else if (score_b === null) combined_score = score_a;
  else combined_score = (score_a + score_b) / 2;

  const effective_score = dealbreakerFailed ? 0 : combined_score;

  return {
    score_a,
    score_b,
    combined_score,
    dealbreaker_failed: dealbreakerFailed,
    effective_score,
  };
}
