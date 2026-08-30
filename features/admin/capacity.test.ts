import { describe, expect, it } from "vitest";
import { capacityRatio, capacityTone } from "@/features/admin/capacity";

describe("capacityRatio", () => {
  it("computes a plain fraction", () => {
    expect(capacityRatio(28, 30)).toBeCloseTo(0.9333, 4);
  });

  it("clamps over-capacity to 1", () => {
    expect(capacityRatio(32, 30)).toBe(1);
  });

  it("clamps negative active counts to 0", () => {
    expect(capacityRatio(-1, 30)).toBe(0);
  });

  it("treats a zero capacity with no active reservations as empty", () => {
    expect(capacityRatio(0, 0)).toBe(0);
  });

  it("treats a zero capacity with active reservations as full rather than dividing by zero", () => {
    expect(capacityRatio(3, 0)).toBe(1);
  });
});

describe("capacityTone", () => {
  it("is calm just under the warning threshold", () => {
    expect(capacityTone(0.79)).toBe("calm");
  });

  it("is warn at the warning threshold", () => {
    expect(capacityTone(0.8)).toBe("warn");
  });

  it("is warn just under full", () => {
    expect(capacityTone(0.99)).toBe("warn");
  });

  it("is full at exactly 1", () => {
    expect(capacityTone(1)).toBe("full");
  });
});
