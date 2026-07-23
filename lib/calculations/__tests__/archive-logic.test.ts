import { describe, it, expect } from "vitest";
import { shouldAutoArchive, isEndingThisMonth } from "@/lib/calculations/archive-logic";
import type { Expense } from "@/lib/validation/expense";
import type { MonthKey } from "@/lib/date/month";

function utc(year: number, month: number, day = 1): Date {
  return new Date(Date.UTC(year, month, day));
}

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

const JAN: MonthKey = { year: 2026, month: 0 };
const MAR: MonthKey = { year: 2026, month: 2 };
const APR: MonthKey = { year: 2026, month: 3 };

describe("shouldAutoArchive — one-time expenses", () => {
  it("does not archive during its own month", () => {
    const expense = baseExpense({ expenseType: "one_time", startDate: utc(2026, 2, 15) });
    expect(shouldAutoArchive(expense, MAR)).toBe(false);
  });

  it("archives once its month has passed", () => {
    const expense = baseExpense({ expenseType: "one_time", startDate: utc(2026, 2, 15) });
    expect(shouldAutoArchive(expense, APR)).toBe(true);
  });

  it("never archives before its own month", () => {
    const expense = baseExpense({ expenseType: "one_time", startDate: utc(2026, 2, 15) });
    expect(shouldAutoArchive(expense, JAN)).toBe(false);
  });
});

describe("shouldAutoArchive — recurring expenses", () => {
  it("does not archive a recurring expense with no end date", () => {
    const expense = baseExpense({ startDate: utc(2020, 0, 1) });
    expect(shouldAutoArchive(expense, APR)).toBe(false);
  });

  it("does not archive during its final (end date's) month", () => {
    const expense = baseExpense({ startDate: utc(2020, 0, 1), endDate: utc(2026, 2, 20) });
    expect(shouldAutoArchive(expense, MAR)).toBe(false);
  });

  it("archives once the end date's month has passed", () => {
    const expense = baseExpense({ startDate: utc(2020, 0, 1), endDate: utc(2026, 2, 20) });
    expect(shouldAutoArchive(expense, APR)).toBe(true);
  });

  it("never re-archives an already-archived expense", () => {
    const expense = baseExpense({
      isActive: false,
      startDate: utc(2020, 0, 1),
      endDate: utc(2026, 2, 20),
    });
    expect(shouldAutoArchive(expense, APR)).toBe(false);
  });
});

describe("isEndingThisMonth", () => {
  it("is true during a recurring expense's final month", () => {
    const expense = baseExpense({ startDate: utc(2020, 0, 1), endDate: utc(2026, 2, 20) });
    expect(isEndingThisMonth(expense, MAR)).toBe(true);
  });

  it("is false in earlier or later months", () => {
    const expense = baseExpense({ startDate: utc(2020, 0, 1), endDate: utc(2026, 2, 20) });
    expect(isEndingThisMonth(expense, JAN)).toBe(false);
    expect(isEndingThisMonth(expense, APR)).toBe(false);
  });

  it("is false for a recurring expense with no end date", () => {
    const expense = baseExpense({ startDate: utc(2020, 0, 1) });
    expect(isEndingThisMonth(expense, MAR)).toBe(false);
  });

  it("is false for one-time expenses (they don't get this warning)", () => {
    const expense = baseExpense({ expenseType: "one_time", startDate: utc(2026, 2, 1) });
    expect(isEndingThisMonth(expense, MAR)).toBe(false);
  });
});
