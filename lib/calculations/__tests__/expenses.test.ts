import { describe, it, expect } from "vitest";
import { recurringCostBreakdown } from "@/lib/calculations/expenses";
import type { Expense } from "@/lib/validation/expense";

function baseExpense(overrides: Partial<Expense>): Expense {
  return {
    id: "1",
    description: "Test expense",
    categoryId: "cat-1",
    unitCost: 100,
    frequency: "monthly",
    expenseType: "recurring",
    isActive: true,
    ...overrides,
  };
}

describe("recurringCostBreakdown", () => {
  it("monthly: monthly cost equals cost per occurrence, yearly = monthly × 12", () => {
    const result = recurringCostBreakdown(baseExpense({ frequency: "monthly", unitCost: 50 }));
    expect(result).toEqual({ monthly: 50, yearly: 600 });
  });

  it("yearly: yearly cost equals cost per occurrence, monthly = yearly ÷ 12", () => {
    const result = recurringCostBreakdown(baseExpense({ frequency: "yearly", unitCost: 1200 }));
    expect(result).toEqual({ monthly: 100, yearly: 1200 });
  });

  it("weekly: converts to equivalent monthly/yearly via the annualized rate", () => {
    const result = recurringCostBreakdown(baseExpense({ frequency: "weekly", unitCost: 10 }));
    expect(result?.yearly).toBeCloseTo(520, 2); // 10 * 52
    expect(result?.monthly).toBeCloseTo(520 / 12, 2);
  });

  it("fortnightly and quarterly convert the same way", () => {
    const fortnightly = recurringCostBreakdown(baseExpense({ frequency: "fortnightly", unitCost: 20 }));
    expect(fortnightly?.yearly).toBeCloseTo(20 * 26, 2);

    const quarterly = recurringCostBreakdown(baseExpense({ frequency: "quarterly", unitCost: 300 }));
    expect(quarterly?.yearly).toBeCloseTo(300 * 4, 2);
  });

  it("returns null for one-time expenses — they aren't a recurring commitment", () => {
    const result = recurringCostBreakdown(
      baseExpense({ expenseType: "one_time", unitCost: 500, startDate: new Date("2026-03-01") })
    );
    expect(result).toBeNull();
  });
});
