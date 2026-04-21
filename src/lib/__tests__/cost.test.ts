import { describe, it, expect } from "vitest";
import { rentToScore } from "../cost";

describe("rentToScore", () => {
  it("gives top score below the range", () => {
    expect(rentToScore(2000)).toBe(5);
    expect(rentToScore(3500)).toBe(5);
  });

  it("maps the five quintile bands correctly", () => {
    expect(rentToScore(3600)).toBe(5); // Q1
    expect(rentToScore(3699)).toBe(5); // Q1 upper edge
    expect(rentToScore(3700)).toBe(4); // Q2 lower edge
    expect(rentToScore(3899)).toBe(4); // Q2 upper edge
    expect(rentToScore(3900)).toBe(3); // Q3 lower edge
    expect(rentToScore(4099)).toBe(3); // Q3 upper edge
    expect(rentToScore(4100)).toBe(2); // Q4 lower edge
    expect(rentToScore(4299)).toBe(2); // Q4 upper edge
    expect(rentToScore(4300)).toBe(1); // Q5 lower edge
    expect(rentToScore(4500)).toBe(1); // Q5 upper edge
  });

  it("gives bottom score above the range", () => {
    expect(rentToScore(5000)).toBe(1);
    expect(rentToScore(9999)).toBe(1);
  });
});
