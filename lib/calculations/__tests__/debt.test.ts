import { describe, it, expect } from "vitest";
import {
  calculatePayoffProjection,
  calculatePaidOffPercentage,
  calculateRequiredPayment,
  calculateDebtToIncomeRatio,
} from "@/lib/calculations/debt";

describe("calculatePayoffProjection", () => {
  it("computes months and total interest for a typical credit-card scenario", () => {
    const result = calculatePayoffProjection(5000, 20, 200);
    expect(result.months).toBe(33);
    expect(result.totalInterest).toBeCloseTo(1600, 0);
  });

  it("handles 0% interest as simple division, no interest accrued", () => {
    const result = calculatePayoffProjection(1200, 0, 100);
    expect(result.months).toBe(12);
    expect(result.totalInterest).toBe(0);
  });

  it("returns null (never pays off) when payment doesn't cover monthly interest", () => {
    // 10000 * (24%/12) = 200/month interest; a 150 payment can never win.
    const result = calculatePayoffProjection(10000, 24, 150);
    expect(result.months).toBeNull();
    expect(result.totalInterest).toBeNull();
  });

  it("computes a realistic minimum-payment credit card scenario", () => {
    const result = calculatePayoffProjection(3000, 22.9, 100);
    expect(result.months).toBe(45);
    expect(result.totalInterest).toBeCloseTo(1500, 0);
  });

  it("treats an already-zero balance as paid off", () => {
    const result = calculatePayoffProjection(0, 20, 200);
    expect(result.months).toBe(0);
    expect(result.totalInterest).toBe(0);
  });

  it("returns 0 months when there's no payment at all", () => {
    const result = calculatePayoffProjection(1000, 10, 0);
    expect(result.months).toBe(0);
  });
});

describe("calculateRequiredPayment", () => {
  it("matches the spec's example: £3,600 over 6 months at 0% is simple division", () => {
    expect(calculateRequiredPayment(3600, 0, 6)).toBe(600);
  });

  it("factors in interest when a rate is present", () => {
    // Should need slightly less than a flat 3000/12=250 since interest compounds on a shrinking balance.
    const payment = calculateRequiredPayment(3000, 22.9, 12);
    expect(payment).toBeCloseTo(282.08, 1);
  });

  it("is roughly consistent with the forward projection for the same scenario", () => {
    // Forward: 5000 @ 20% paid off in 33 months needs about ~198-200/month.
    const payment = calculateRequiredPayment(5000, 20, 33);
    expect(payment).toBeGreaterThan(195);
    expect(payment).toBeLessThan(205);
  });

  it("returns 0 for an already-zero balance or non-positive months", () => {
    expect(calculateRequiredPayment(0, 20, 12)).toBe(0);
    expect(calculateRequiredPayment(1000, 20, 0)).toBe(0);
  });
});

describe("calculatePaidOffPercentage", () => {
  it("computes the fraction paid off relative to the original amount", () => {
    expect(calculatePaidOffPercentage(6000, 10000)).toBeCloseTo(0.4, 5);
  });

  it("returns null when there's no original amount to compare against", () => {
    expect(calculatePaidOffPercentage(6000, undefined)).toBeNull();
  });

  it("clamps to 0 if the balance somehow exceeds the original amount", () => {
    expect(calculatePaidOffPercentage(12000, 10000)).toBe(0);
  });

  it("clamps to 1 for a fully paid off debt", () => {
    expect(calculatePaidOffPercentage(0, 10000)).toBe(1);
  });
});

describe("calculateDebtToIncomeRatio", () => {
  it("computes the ratio of monthly debt payments to gross income", () => {
    expect(calculateDebtToIncomeRatio(900, 3000)).toBeCloseTo(0.3, 5);
  });

  it("returns null when there's no income to divide by", () => {
    expect(calculateDebtToIncomeRatio(900, 0)).toBeNull();
  });
});
