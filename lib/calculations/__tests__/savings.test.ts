import { describe, it, expect } from "vitest";
import { calculateSavingsBreakdown } from "@/lib/calculations/savings";
import type { BudgetSummary } from "@/lib/calculations/budget-summary";
import type { CategoryTotal } from "@/lib/calculations/expenses";

function fakeIncomeBreakdown(netMonthly: number) {
  const split = { yearly: netMonthly * 12, monthly: netMonthly, weekly: 0, daily: 0, hourly: 0 };
  return {
    gross: split,
    net: split,
    deductions: { monthlyTax: 0, monthlyNationalInsurance: 0, monthlyPension: 0, totalMonthly: 0, totalYearly: 0 },
  };
}

function category(overrides: Partial<CategoryTotal>): CategoryTotal {
  return {
    categoryId: "cat-1",
    categoryName: "Other",
    yearly: 0,
    monthly: 0,
    percentageOfIncome: 0,
    ...overrides,
  };
}

function fakeSummary(opts: {
  netMonthlyIncome: number;
  savingsCategoryMonthly?: number;
  totalMonthlyExpenses: number;
}): BudgetSummary {
  const remainingMonthly = opts.netMonthlyIncome - opts.totalMonthlyExpenses;
  const categories: CategoryTotal[] = [];
  if (opts.savingsCategoryMonthly !== undefined) {
    categories.push(category({ categoryName: "Savings", monthly: opts.savingsCategoryMonthly }));
  }
  return {
    income: fakeIncomeBreakdown(opts.netMonthlyIncome),
    incomeSources: [],
    totalYearlyExpenses: 0,
    totalMonthlyExpenses: opts.totalMonthlyExpenses,
    categories,
    remaining: {
      monthly: remainingMonthly,
      percentageOfIncome: opts.netMonthlyIncome === 0 ? 0 : remainingMonthly / opts.netMonthlyIncome,
    },
    endingSoonExpenses: [],
  };
}

describe("calculateSavingsBreakdown", () => {
  it("0 savings-category expenses but 15% unallocated remaining budget → 15% savings rate", () => {
    // Net income 3000, expenses 2550 (no Savings category), remaining 450 = 15%.
    const summary = fakeSummary({ netMonthlyIncome: 3000, totalMonthlyExpenses: 2550 });
    const result = calculateSavingsBreakdown(summary);
    expect(result.savingsCategoryMonthly).toBe(0);
    expect(result.savingsRate).toBeCloseTo(0.15, 5);
  });

  it("10% allocated to a Savings category, nothing left over → 10% savings rate", () => {
    // Net income 3000, Savings category 300 (10%), total expenses exactly consumes the rest.
    const summary = fakeSummary({ netMonthlyIncome: 3000, savingsCategoryMonthly: 300, totalMonthlyExpenses: 3000 });
    const result = calculateSavingsBreakdown(summary);
    expect(result.savingsRate).toBeCloseTo(0.1, 5);
  });

  it("20% allocated to a Savings category → 20% savings rate", () => {
    const summary = fakeSummary({ netMonthlyIncome: 3000, savingsCategoryMonthly: 600, totalMonthlyExpenses: 3000 });
    const result = calculateSavingsBreakdown(summary);
    expect(result.savingsRate).toBeCloseTo(0.2, 5);
  });

  it("low savings rate with high expenses (overspending) doesn't go negative from the remainder", () => {
    // Overspent: remaining is negative, shouldn't subtract from savings.
    const summary = fakeSummary({ netMonthlyIncome: 3000, savingsCategoryMonthly: 50, totalMonthlyExpenses: 3200 });
    const result = calculateSavingsBreakdown(summary);
    // Only the explicit Savings-category spend counts; the negative remainder is clamped to 0.
    expect(result.totalSavingsMonthly).toBe(50);
    expect(result.savingsRate).toBeCloseTo(50 / 3000, 5);
  });

  it("combines Savings-category spend AND positive remaining budget", () => {
    // Net income 3000, Savings category 200, expenses total 2500 (remaining 500).
    const summary = fakeSummary({ netMonthlyIncome: 3000, savingsCategoryMonthly: 200, totalMonthlyExpenses: 2500 });
    const result = calculateSavingsBreakdown(summary);
    expect(result.totalSavingsMonthly).toBeCloseTo(200 + 500, 5);
    expect(result.savingsRate).toBeCloseTo(700 / 3000, 5);
  });

  it("returns 0 rather than dividing by zero when there's no income", () => {
    const summary = fakeSummary({ netMonthlyIncome: 0, totalMonthlyExpenses: 0 });
    expect(calculateSavingsBreakdown(summary).savingsRate).toBe(0);
  });
});
