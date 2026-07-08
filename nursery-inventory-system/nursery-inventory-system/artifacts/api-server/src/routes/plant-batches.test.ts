import { describe, it, expect } from "vitest";
import { calcCosts } from "./plant-batches";

describe("calcCosts", () => {
  // ── spec examples ──────────────────────────────────────────────────────────

  it("Example 1: qty=100, price=5, transport=0, other=0 → total=500, cpp=5", () => {
    const { totalBatchCost, costPerPlant } = calcCosts(100, 5, 0, 0);
    expect(totalBatchCost).toBe(500);
    expect(costPerPlant).toBe(5);
  });

  it("Example 2: qty=100, price=5, transport=100, other=50 → total=650, cpp=6.5", () => {
    const { totalBatchCost, costPerPlant } = calcCosts(100, 5, 100, 50);
    expect(totalBatchCost).toBe(650);
    expect(costPerPlant).toBe(6.5);
  });

  // ── formula correctness ────────────────────────────────────────────────────

  it("calculates total as (qty × price) + transport + other, NOT qty × (qty × price)", () => {
    // The old string-concat bug would produce 50000 for this case
    const { totalBatchCost } = calcCosts(100, 5, 0, 0);
    expect(totalBatchCost).not.toBe(50000);
    expect(totalBatchCost).toBe(500);
  });

  it("does not double-multiply: total is qty×price, not qty×qty×price", () => {
    const { totalBatchCost, costPerPlant } = calcCosts(50, 10, 0, 0);
    expect(totalBatchCost).toBe(500);   // 50 × 10, not 50 × 50 × 10 = 25000
    expect(costPerPlant).toBe(10);
  });

  it("includes transport and other costs in total but not in per-plant base", () => {
    // total = (10 × 2) + 30 + 20 = 70; cpp = 70/10 = 7
    const { totalBatchCost, costPerPlant } = calcCosts(10, 2, 30, 20);
    expect(totalBatchCost).toBe(70);
    expect(costPerPlant).toBe(7);
  });

  it("returns costPerPlant=0 when qty=0 (no division by zero)", () => {
    const { totalBatchCost, costPerPlant } = calcCosts(0, 5, 0, 0);
    expect(totalBatchCost).toBe(0);
    expect(costPerPlant).toBe(0);
  });

  it("handles fractional prices correctly", () => {
    const { totalBatchCost, costPerPlant } = calcCosts(3, 1.5, 0, 0);
    expect(totalBatchCost).toBeCloseTo(4.5);
    expect(costPerPlant).toBeCloseTo(1.5);
  });

  // ── defence against string inputs (string-concat regression) ───────────────

  it("is safe when inputs are numeric strings (string-concat regression)", () => {
    // Simulates form.watch() returning strings instead of numbers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { totalBatchCost, costPerPlant } = calcCosts("100" as any, "5" as any, "0" as any, "0" as any);
    expect(totalBatchCost).toBe(500);   // NOT "50000" via string concat
    expect(costPerPlant).toBe(5);       // NOT 500
  });

  it("is safe when transport/other are string '0' (original concat bug)", () => {
    // (100 * 5) + "0" + "0" would give "50000" without Number() coercion
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { totalBatchCost } = calcCosts(100 as any, 5 as any, "0" as any, "0" as any);
    expect(totalBatchCost).toBe(500);
  });
});
