import { describe, it, expect } from "vitest";
import { distanceToScore, haversineKm } from "../commute";

describe("haversineKm", () => {
  it("returns 0 for identical points", () => {
    const p = { lat: 1.3521, lng: 103.8198 };
    expect(haversineKm(p, p)).toBe(0);
  });

  it("matches hand-computed Singapore distance within tolerance", () => {
    // Raffles Place (1.2840, 103.8510) → Jurong East (1.3331, 103.7436)
    // Published distance ≈ 13 km.
    const d = haversineKm(
      { lat: 1.2840, lng: 103.851 },
      { lat: 1.3331, lng: 103.7436 }
    );
    expect(d).toBeGreaterThan(12);
    expect(d).toBeLessThan(14);
  });

  it("is symmetric", () => {
    const a = { lat: 1.3, lng: 103.8 };
    const b = { lat: 1.4, lng: 103.9 };
    expect(haversineKm(a, b)).toBeCloseTo(haversineKm(b, a), 6);
  });
});

describe("distanceToScore", () => {
  it("gives top marks under 3 km", () => {
    expect(distanceToScore(0)).toBe(5);
    expect(distanceToScore(2.9)).toBe(5);
    expect(distanceToScore(3)).toBe(5);
  });
  it("scales down in bands", () => {
    expect(distanceToScore(5)).toBe(4);
    expect(distanceToScore(7)).toBe(4);
    expect(distanceToScore(7.1)).toBe(3);
    expect(distanceToScore(15)).toBe(3);
    expect(distanceToScore(20)).toBe(2);
    expect(distanceToScore(25)).toBe(2);
  });
  it("falls to 1 for very far distances", () => {
    expect(distanceToScore(30)).toBe(1);
    expect(distanceToScore(500)).toBe(1);
  });
});
