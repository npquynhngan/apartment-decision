// Scores apartment rent against a [3500, 4500] quantile range.
// The range is split into 5 equal bands of 200 each (quintiles).
// Lower rent → higher score. Rents outside the range are clamped to 5 or 1.
//
//   ≤ 3700  →  5  (Q1 — cheapest)
//   ≤ 3900  →  4
//   ≤ 4100  →  3
//   ≤ 4300  →  2
//   > 4300  →  1  (Q5 — most expensive)

export function rentToScore(rent: number): 1 | 2 | 3 | 4 | 5 {
  if (rent <= 3700) return 5;
  if (rent <= 3900) return 4;
  if (rent <= 4100) return 3;
  if (rent <= 4300) return 2;
  return 1;
}
