import { describe, it, expect } from "vitest";
import { compareValues } from "@/lib/calculations/comparison";
import { buildMonthlySeries, monthRangeAround } from "@/lib/calculations/monthly-series";
import { DEFAULT_TAX_PROFILE } from "@/lib/validation/tax-profile";
import type { Category } from "@/lib/validation/category";
import type { Expense } from "@/lib/validation/expense";
import type { IncomeSource } from "@/lib/validation/income-source";

describe("compareValues", () => {
  it("computes a positive percent change when current is higher", () => {
    const result = compareValues(120, 100);
    expect(result.absoluteChange).toBe(20);
    expect(result.percentChange).toBeCloseTo(20, 5);
  });

  it("computes a negative percent change when current is lower", () => {
    const result = compareValues(80, 100);
    expect(result.percentChange).toBeCloseTo(-20, 5);
  });

  it("returns null percentChange when there's nothing to compare against", () => {
    const result = compareValues(50, 0);
    expect(result.percentChange).toBeNull();
    expect(result.absoluteChange).toBe(50);
  });
});

describe("monthRangeAround", () => {
  it("returns months in order, including the center", () => {
    const months = monthRangeAround({ year: 2026, month: 5 }, 2, 1);
    expect(months).toEqual([
      { year: 2026, month: 3 },
      { year: 2026, month: 4 },
      { year: 2026, month: 5 },
      { year: 2026, month: 6 },
    ]);
  });
});

describe("buildMonthlySeries", () => {
  const categories: Category[] = [
    { id: "sub", name: "Subscriptions", group: "Personal", color: "#000000", isDefault: true },
  ];

  const expenses: Expense[] = [
    {
      id: "1",
      description: "Gym",
      categoryId: "sub",
      unitCost: 40,
      frequency: "monthly",
      expenseType: "recurring",
      isActive: true,
      startDate: new Date("2026-01-01"),
    },
    {
      id: "2",
      description: "Annual renewal",
      categoryId: "sub",
      unitCost: 120,
      frequency: "yearly",
      expenseType: "recurring",
      isActive: true,
      startDate: new Date("2025-03-15"), // March anchor
    },
  ];

  const incomeSources: IncomeSource[] = [
    {
      id: "salary",
      label: "Salary",
      source: "main_job",
      grossYearlyAmount: 36000,
      effectiveFrom: new Date("2020-01-01"),
    },
  ];

  it("smooths a yearly expense's contribution evenly, rather than spiking in its billing month", () => {
    const months = monthRangeAround({ year: 2026, month: 2 }, 1, 1); // Feb, Mar, Apr 2026
    const series = buildMonthlySeries(incomeSources, expenses, categories, DEFAULT_TAX_PROFILE, months);

    const feb = series[0]!;
    const mar = series[1]!;
    const apr = series[2]!;

    // £120/year ÷ 12 = £10/month, every month — including March, its
    // billing month, which is no longer any different from Feb or April.
    expect(feb.expenses).toBeCloseTo(40 + 10, 2);
    expect(mar.expenses).toBeCloseTo(40 + 10, 2);
    expect(apr.expenses).toBeCloseTo(40 + 10, 2);
  });

  it("labels each point with a compact month label", () => {
    const months = monthRangeAround({ year: 2026, month: 2 }, 0, 0);
    const series = buildMonthlySeries(incomeSources, expenses, categories, DEFAULT_TAX_PROFILE, months);
    expect(series[0]!.label).toBe("Mar '26");
  });
});
