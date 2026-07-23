import { describe, it, expect } from "vitest";
import { deriveInsights } from "@/lib/insights";
import type { BudgetSummary } from "@/lib/calculations/budget-summary";
import type { CategoryTotal } from "@/lib/calculations/expenses";

function fakeIncomeBreakdown() {
  const split = { yearly: 40000, monthly: 3333.33, weekly: 769.23, daily: 153.85, hourly: 102.56 };
  return {
    gross: split,
    net: split,
    deductions: { monthlyTax: 0, monthlyNationalInsurance: 0, monthlyPension: 0, totalMonthly: 0, totalYearly: 0 },
  };
}

function fakeSummary(overrides: {
  categories?: CategoryTotal[];
  remainingMonthly?: number;
  remainingPercentage?: number;
  endingSoonExpenses?: string[];
}): BudgetSummary {
  return {
    income: fakeIncomeBreakdown(),
    incomeSources: [],
    totalYearlyExpenses: 0,
    totalMonthlyExpenses: 0,
    categories: overrides.categories ?? [],
    remaining: {
      monthly: overrides.remainingMonthly ?? 500,
      percentageOfIncome: overrides.remainingPercentage ?? 0.15,
    },
    endingSoonExpenses: overrides.endingSoonExpenses ?? [],
  };
}

function category(overrides: Partial<CategoryTotal>): CategoryTotal {
  return {
    categoryId: "cat-1",
    categoryName: "Food",
    yearly: 1200,
    monthly: 100,
    percentageOfIncome: 0.03,
    ...overrides,
  };
}

describe("deriveInsights — over-budget alerts", () => {
  it("flags a single category that's over its budget", () => {
    const summary = fakeSummary({
      categories: [category({ categoryName: "Food", monthly: 150, monthlyBudget: 100 })],
    });
    const insights = deriveInsights(summary);
    expect(insights[0]).toEqual({ kind: "over-budget", categoryNames: ["Food"] });
  });

  it("does not flag a category within its budget", () => {
    const summary = fakeSummary({
      categories: [category({ categoryName: "Food", monthly: 80, monthlyBudget: 100 })],
    });
    const insights = deriveInsights(summary);
    expect(insights.find((i) => i.kind === "over-budget")).toBeUndefined();
  });

  it("does not flag a category with no budget set at all", () => {
    const summary = fakeSummary({
      categories: [category({ categoryName: "Food", monthly: 999, monthlyBudget: undefined })],
    });
    const insights = deriveInsights(summary);
    expect(insights.find((i) => i.kind === "over-budget")).toBeUndefined();
  });

  it("collects multiple over-budget categories into one insight", () => {
    const summary = fakeSummary({
      categories: [
        category({ categoryId: "c1", categoryName: "Food", monthly: 150, monthlyBudget: 100 }),
        category({ categoryId: "c2", categoryName: "Transport", monthly: 90, monthlyBudget: 50 }),
      ],
    });
    const insights = deriveInsights(summary);
    const overBudget = insights.find((i) => i.kind === "over-budget");
    expect(overBudget).toMatchObject({ categoryNames: ["Food", "Transport"] });
  });

  it("is prioritized first even when other insights would also apply", () => {
    const summary = fakeSummary({
      categories: [category({ categoryName: "Food", monthly: 150, monthlyBudget: 100, percentageOfIncome: 0.5 })],
      remainingMonthly: -200,
    });
    const insights = deriveInsights(summary);
    expect(insights[0]!.kind).toBe("over-budget");
  });
});

describe("deriveInsights — ending-soon alerts", () => {
  it("flags expenses ending this month", () => {
    const summary = fakeSummary({ endingSoonExpenses: ["Gym membership"] });
    const insights = deriveInsights(summary);
    expect(insights.find((i) => i.kind === "ending-soon")).toEqual({
      kind: "ending-soon",
      expenseNames: ["Gym membership"],
    });
  });

  it("does not flag anything when nothing is ending", () => {
    const summary = fakeSummary({ endingSoonExpenses: [] });
    const insights = deriveInsights(summary);
    expect(insights.find((i) => i.kind === "ending-soon")).toBeUndefined();
  });
});
