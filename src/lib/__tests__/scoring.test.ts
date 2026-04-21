import { describe, it, expect } from "vitest";
import { computeApartmentScore, computeSizeScore } from "../scoring";

describe("computeApartmentScore", () => {
  it("returns all nulls / false when nothing has been scored", () => {
    expect(computeApartmentScore([], [])).toEqual({
      score_a: null,
      score_b: null,
      combined_score: null,
      dealbreaker_failed: false,
      effective_score: null,
    });
  });

  it("perfect 5s yield a normalized score of 1 for both partners", () => {
    const criteria = [
      { id: "c1", weight_a: 5, weight_b: 3, is_dealbreaker: false },
      { id: "c2", weight_a: 10, weight_b: 7, is_dealbreaker: false },
    ];
    const scores = [
      { criterion_id: "c1", user_slot: "a" as const, value: 5 },
      { criterion_id: "c2", user_slot: "a" as const, value: 5 },
      { criterion_id: "c1", user_slot: "b" as const, value: 5 },
      { criterion_id: "c2", user_slot: "b" as const, value: 5 },
    ];
    const r = computeApartmentScore(criteria, scores);
    expect(r.score_a).toBeCloseTo(1);
    expect(r.score_b).toBeCloseTo(1);
    expect(r.combined_score).toBeCloseTo(1);
    expect(r.dealbreaker_failed).toBe(false);
    expect(r.effective_score).toBeCloseTo(1);
  });

  it("weights each criterion correctly", () => {
    // weight_a = 5 for both; one scored 5, one scored 3
    // weighted_sum = 5*5 + 5*3 = 40; max_possible = 5*5 + 5*5 = 50
    // score_a = 40 / 50 = 0.8
    const criteria = [
      { id: "c1", weight_a: 5, weight_b: 5, is_dealbreaker: false },
      { id: "c2", weight_a: 5, weight_b: 5, is_dealbreaker: false },
    ];
    const scores = [
      { criterion_id: "c1", user_slot: "a" as const, value: 5 },
      { criterion_id: "c2", user_slot: "a" as const, value: 3 },
    ];
    const r = computeApartmentScore(criteria, scores);
    expect(r.score_a).toBeCloseTo(0.8);
    expect(r.score_b).toBeNull();
    expect(r.combined_score).toBeCloseTo(0.8);
  });

  it("higher-weighted criteria dominate the combined score", () => {
    // c1 w=10 scored 5; c2 w=1 scored 1
    // weighted_sum = 10*5 + 1*1 = 51; max_possible = 10*5 + 1*5 = 55
    // score_a = 51/55 ≈ 0.927
    const criteria = [
      { id: "c1", weight_a: 10, weight_b: 10, is_dealbreaker: false },
      { id: "c2", weight_a: 1, weight_b: 1, is_dealbreaker: false },
    ];
    const scores = [
      { criterion_id: "c1", user_slot: "a" as const, value: 5 },
      { criterion_id: "c2", user_slot: "a" as const, value: 1 },
    ];
    const r = computeApartmentScore(criteria, scores);
    expect(r.score_a).toBeCloseTo(51 / 55);
  });

  it("triggers dealbreaker when value <= 1 on a dealbreaker criterion", () => {
    const criteria = [
      { id: "c1", weight_a: 5, weight_b: 5, is_dealbreaker: true },
    ];
    const scores = [
      { criterion_id: "c1", user_slot: "a" as const, value: 1 },
    ];
    const r = computeApartmentScore(criteria, scores);
    expect(r.dealbreaker_failed).toBe(true);
    expect(r.effective_score).toBe(0);
    // combined_score is still computed — effective_score is the ranking value
    expect(r.combined_score).toBeCloseTo(0.2); // 5*1 / 5*5 = 0.2
  });

  it("does NOT trigger dealbreaker at value = 2", () => {
    const criteria = [
      { id: "c1", weight_a: 5, weight_b: 5, is_dealbreaker: true },
    ];
    const scores = [
      { criterion_id: "c1", user_slot: "a" as const, value: 2 },
    ];
    const r = computeApartmentScore(criteria, scores);
    expect(r.dealbreaker_failed).toBe(false);
    expect(r.effective_score).toBeCloseTo(0.4);
  });

  it("either partner can trigger a dealbreaker", () => {
    const criteria = [
      { id: "c1", weight_a: 5, weight_b: 5, is_dealbreaker: true },
    ];
    const scores = [
      { criterion_id: "c1", user_slot: "a" as const, value: 5 },
      { criterion_id: "c1", user_slot: "b" as const, value: 1 },
    ];
    const r = computeApartmentScore(criteria, scores);
    expect(r.dealbreaker_failed).toBe(true);
    expect(r.effective_score).toBe(0);
  });

  it("uses the single-partner score when only one has scored", () => {
    const criteria = [
      { id: "c1", weight_a: 5, weight_b: 5, is_dealbreaker: false },
    ];
    const scores = [
      { criterion_id: "c1", user_slot: "a" as const, value: 4 },
    ];
    const r = computeApartmentScore(criteria, scores);
    expect(r.score_a).toBeCloseTo(0.8);
    expect(r.score_b).toBeNull();
    expect(r.combined_score).toBeCloseTo(0.8);
  });

  it("returns null score when all relevant weights are 0", () => {
    // Partner A weighted this criterion at 0 but still scored it.
    // max_possible for A = 0 → score_a is null.
    const criteria = [
      { id: "c1", weight_a: 0, weight_b: 5, is_dealbreaker: false },
    ];
    const scores = [
      { criterion_id: "c1", user_slot: "a" as const, value: 5 },
      { criterion_id: "c1", user_slot: "b" as const, value: 3 },
    ];
    const r = computeApartmentScore(criteria, scores);
    expect(r.score_a).toBeNull();
    expect(r.score_b).toBeCloseTo(0.6);
    expect(r.combined_score).toBeCloseTo(0.6);
  });

  it("averages partner scores for the combined score", () => {
    const criteria = [
      { id: "c1", weight_a: 5, weight_b: 5, is_dealbreaker: false },
    ];
    const scores = [
      { criterion_id: "c1", user_slot: "a" as const, value: 5 }, // 1.0
      { criterion_id: "c1", user_slot: "b" as const, value: 3 }, // 0.6
    ];
    const r = computeApartmentScore(criteria, scores);
    expect(r.combined_score).toBeCloseTo(0.8);
  });

  it("ignores scores for criteria that no longer exist", () => {
    // Deleted criterion — score row exists but not in criteria list.
    const r = computeApartmentScore(
      [],
      [{ criterion_id: "ghost", user_slot: "a", value: 5 }]
    );
    expect(r.score_a).toBeNull();
    expect(r.combined_score).toBeNull();
  });
});

describe("computeSizeScore", () => {
  it("studio: 0 bed + 1 bath = 1", () => {
    expect(computeSizeScore(0, 1)).toBe(1);
  });

  it("1 bed + 1 bath = 2", () => {
    expect(computeSizeScore(1, 1)).toBe(2);
  });

  it("2 bed + 1 bath = 3", () => {
    expect(computeSizeScore(2, 1)).toBe(3);
  });

  it("3 bed + 2 bath = 5 (capped)", () => {
    expect(computeSizeScore(3, 2)).toBe(5);
  });

  it("10 bed + 5 bath = 5 (capped)", () => {
    expect(computeSizeScore(10, 5)).toBe(5);
  });

  it("null bedrooms → no score", () => {
    expect(computeSizeScore(null, 1)).toBeNull();
  });

  it("null bathrooms → no score", () => {
    expect(computeSizeScore(1, null)).toBeNull();
  });

  it("both null → no score", () => {
    expect(computeSizeScore(null, null)).toBeNull();
  });
});
