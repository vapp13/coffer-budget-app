import { describe, it, expect } from "vitest";
import { expenseOccursInMonth, expenseAmountForMonth, expenseMonthlyEquivalent } from "@/lib/calculations/recurrence";
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
const FEB: MonthKey = { year: 2026, month: 1 };
const MAR: MonthKey = { year: 2026, month: 2 };
const APR: MonthKey = { year: 2026, month: 3 };
const JUN: MonthKey = { year: 2026, month: 5 };
const SEP: MonthKey = { year: 2026, month: 8 };
const DEC: MonthKey = { year: 2026, month: 11 };
const NEXT_MAR: MonthKey = { year: 2027, month: 2 };

describe("monthly frequency", () => {
  it("a monthly expense starting in March does not appear in January or February", () => {
    const expense = baseExpense({ frequency: "monthly", startDate: utc(2026, 2, 15) });
    expect(expenseOccursInMonth(expense, JAN)).toBe(false);
    expect(expenseOccursInMonth(expense, FEB)).toBe(false);
    expect(expenseOccursInMonth(expense, MAR)).toBe(true);
    expect(expenseOccursInMonth(expense, APR)).toBe(true);
  });

  it("with no end date, recurrence continues indefinitely", () => {
    const expense = baseExpense({ frequency: "monthly", startDate: utc(2020, 0, 1) });
    expect(expenseOccursInMonth(expense, NEXT_MAR)).toBe(true);
  });

  it("contributes exactly its unit cost each occurring month", () => {
    const expense = baseExpense({ frequency: "monthly", unitCost: 250, startDate: utc(2026, 2, 1) });
    expect(expenseAmountForMonth(expense, MAR)).toBe(250);
    expect(expenseAmountForMonth(expense, JAN)).toBe(0);
  });
});

describe("yearly frequency", () => {
  it("occurs once per year, in its anchor month only", () => {
    const expense = baseExpense({ frequency: "yearly", startDate: utc(2025, 8, 10) }); // September anchor
    expect(expenseOccursInMonth(expense, SEP)).toBe(true);
    expect(expenseOccursInMonth(expense, { year: 2027, month: 8 })).toBe(true);
    expect(expenseOccursInMonth(expense, JAN)).toBe(false);
    expect(expenseOccursInMonth(expense, DEC)).toBe(false);
  });

  it("contributes the full unit cost in its billing month, and nothing otherwise", () => {
    const expense = baseExpense({ frequency: "yearly", unitCost: 95, startDate: utc(2025, 8, 10) });
    expect(expenseAmountForMonth(expense, SEP)).toBe(95);
    expect(expenseAmountForMonth(expense, JAN)).toBe(0);
  });

  it("with no start date or createdAt, smooths evenly across all 12 months as a fallback", () => {
    const expense = baseExpense({ frequency: "yearly", unitCost: 120 });
    expect(expenseAmountForMonth(expense, JAN)).toBeCloseTo(10, 5);
    expect(expenseAmountForMonth(expense, JUN)).toBeCloseTo(10, 5);
  });

  it("uses createdAt as the anchor when no start date is set", () => {
    const expense = baseExpense({ frequency: "yearly", unitCost: 95, createdAt: utc(2026, 5, 1) }); // June
    expect(expenseOccursInMonth(expense, JUN)).toBe(true);
    expect(expenseOccursInMonth(expense, SEP)).toBe(false);
  });
});

describe("quarterly frequency", () => {
  it("recurs every third month from its anchor", () => {
    const expense = baseExpense({ frequency: "quarterly", startDate: utc(2026, 0, 1) }); // Jan anchor
    expect(expenseOccursInMonth(expense, JAN)).toBe(true);
    expect(expenseOccursInMonth(expense, FEB)).toBe(false);
    expect(expenseOccursInMonth(expense, MAR)).toBe(false);
    expect(expenseOccursInMonth(expense, APR)).toBe(true);
  });
});

describe("end date", () => {
  it("stops recurrence after the end date's month", () => {
    const expense = baseExpense({
      frequency: "monthly",
      startDate: utc(2026, 0, 1),
      endDate: utc(2026, 2, 20),
    });
    expect(expenseOccursInMonth(expense, MAR)).toBe(true);
    expect(expenseOccursInMonth(expense, APR)).toBe(false);
  });
});

describe("inactive expenses", () => {
  it("never occur regardless of dates", () => {
    const expense = baseExpense({ isActive: false, startDate: utc(2020, 0, 1) });
    expect(expenseOccursInMonth(expense, MAR)).toBe(false);
  });
});

describe("one-time expenses", () => {
  it("occurs only in its own month, ignoring frequency entirely", () => {
    const expense = baseExpense({
      expenseType: "one_time",
      frequency: "monthly", // deliberately set but should be ignored
      startDate: utc(2026, 2, 10),
    });
    expect(expenseOccursInMonth(expense, JAN)).toBe(false);
    expect(expenseOccursInMonth(expense, FEB)).toBe(false);
    expect(expenseOccursInMonth(expense, MAR)).toBe(true);
    expect(expenseOccursInMonth(expense, APR)).toBe(false);
  });

  it("contributes its full cost once, not a monthly-equivalent share", () => {
    const expense = baseExpense({
      expenseType: "one_time",
      unitCost: 500,
      startDate: utc(2026, 2, 10),
    });
    expect(expenseAmountForMonth(expense, MAR)).toBe(500);
    expect(expenseAmountForMonth(expense, APR)).toBe(0);
  });
});

describe("daily/weekly/fortnightly frequencies", () => {
  it("scale by the target month's actual day count", () => {
    const daily = baseExpense({ frequency: "daily", unitCost: 2, startDate: utc(2026, 0, 1) });
    // February 2026 (28 days) vs a 31-day month
    expect(expenseAmountForMonth(daily, FEB)).toBeCloseTo(2 * 28, 5);
    expect(expenseAmountForMonth(daily, JAN)).toBeCloseTo(2 * 31, 5);
  });

  it("weekly and fortnightly divide the month's days accordingly", () => {
    const weekly = baseExpense({ frequency: "weekly", unitCost: 14, startDate: utc(2026, 0, 1) });
    const fortnightly = baseExpense({ frequency: "fortnightly", unitCost: 28, startDate: utc(2026, 0, 1) });
    expect(expenseAmountForMonth(weekly, JAN)).toBeCloseTo(14 * (31 / 7), 5);
    expect(expenseAmountForMonth(fortnightly, JAN)).toBeCloseTo(28 * (31 / 14), 5);
  });
});

describe("expenseMonthlyEquivalent — smoothed monthly totals for aggregates", () => {
  it("reproduces the reported bug exactly: Gym £42/mo + Runescape £7.99/mo + Amazon Prime £95/yr", () => {
    const gym = baseExpense({
      id: "gym",
      unitCost: 42,
      frequency: "monthly",
      startDate: utc(2025, 0, 1),
    });
    const runescape = baseExpense({
      id: "runescape",
      unitCost: 7.99,
      frequency: "monthly",
      startDate: utc(2025, 0, 1),
    });
    const amazonPrime = baseExpense({
      id: "amazon",
      unitCost: 95,
      frequency: "yearly",
      startDate: utc(2025, 8, 15), // billing month: September — deliberately NOT the target month
    });

    const total =
      expenseMonthlyEquivalent(gym, MAR) +
      expenseMonthlyEquivalent(runescape, MAR) +
      expenseMonthlyEquivalent(amazonPrime, MAR);

    expect(total).toBeCloseTo(42 + 7.99 + 95 / 12, 2);
    expect(total).toBeCloseTo(57.91, 2);
  });

  it("a yearly expense contributes the same smoothed amount every month, not just its billing month", () => {
    const yearly = baseExpense({ unitCost: 95, frequency: "yearly", startDate: utc(2025, 8, 15) });
    const expected = 7.92; // round2(95 / 12)
    expect(expenseMonthlyEquivalent(yearly, JAN)).toBeCloseTo(expected, 2);
    expect(expenseMonthlyEquivalent(yearly, MAR)).toBeCloseTo(expected, 2);
    expect(expenseMonthlyEquivalent(yearly, SEP)).toBeCloseTo(expected, 2);
  });

  it("a monthly expense's smoothed amount equals its cost per occurrence, unchanged", () => {
    const monthly = baseExpense({ unitCost: 42, frequency: "monthly", startDate: utc(2025, 0, 1) });
    expect(expenseMonthlyEquivalent(monthly, MAR)).toBeCloseTo(42, 2);
  });

  it("weekly/fortnightly/quarterly all smooth to a stable monthly figure regardless of the specific month's day count", () => {
    const weekly = baseExpense({ unitCost: 14, frequency: "weekly", startDate: utc(2025, 0, 1) });
    const fortnightly = baseExpense({ unitCost: 28, frequency: "fortnightly", startDate: utc(2025, 0, 1) });
    const quarterly = baseExpense({ unitCost: 300, frequency: "quarterly", startDate: utc(2025, 0, 1) });

    // Same result in Feb (28 days) and Mar (31 days) — unlike the old
    // occurrence-based calculation, this no longer varies by day count.
    expect(expenseMonthlyEquivalent(weekly, FEB)).toBeCloseTo(expenseMonthlyEquivalent(weekly, MAR), 2);
    expect(expenseMonthlyEquivalent(weekly, JAN)).toBeCloseTo(60.67, 2);
    expect(expenseMonthlyEquivalent(fortnightly, JAN)).toBeCloseTo(60.67, 2);
    expect(expenseMonthlyEquivalent(quarterly, JAN)).toBeCloseTo(100, 2);
  });

  it("one-time expenses are unaffected — still only count in their own month, in full", () => {
    const oneTime = baseExpense({ expenseType: "one_time", unitCost: 500, startDate: utc(2026, 2, 10) });
    expect(expenseMonthlyEquivalent(oneTime, MAR)).toBe(500);
    expect(expenseMonthlyEquivalent(oneTime, JAN)).toBe(0);
  });

  it("respects start/end date bounds — contributes nothing outside the active range", () => {
    const bounded = baseExpense({
      unitCost: 95,
      frequency: "yearly",
      startDate: utc(2026, 5, 1),
      endDate: utc(2026, 8, 30),
    });
    expect(expenseMonthlyEquivalent(bounded, JAN)).toBe(0); // before start
    expect(expenseMonthlyEquivalent(bounded, { year: 2026, month: 6 })).toBeCloseTo(7.92, 2);
  });

  it("inactive (archived) expenses contribute nothing", () => {
    const archived = baseExpense({ unitCost: 95, frequency: "yearly", isActive: false, startDate: utc(2025, 0, 1) });
    expect(expenseMonthlyEquivalent(archived, MAR)).toBe(0);
  });
});
