import { describe, it, expect } from "vitest";
import type { Category } from "@/lib/validation/category";
import type { Expense } from "@/lib/validation/expense";
import type { IncomeSource } from "@/lib/validation/income-source";
import { DEFAULT_TAX_PROFILE } from "@/lib/validation/tax-profile";
import { calculateBudgetSummary } from "@/lib/calculations/budget-summary";

// Fixture data transcribed directly from Budget_2026.xlsx's
// "Expense Listing" and "Expense Breakdown" blocks.

const categoryNames = [
  "Mortgage",
  "Maintenance",
  "Utilities",
  "Food",
  "Transport",
  "Subscriptions",
  "Personal Spending",
  "Credit",
  "Investment",
  "Savings",
  "Other",
] as const;

const categories: Category[] = categoryNames.map((name) => ({
  id: name,
  name,
  group: "Personal",
  color: "#4C6FFF",
  isDefault: true,
}));

const expenses: Expense[] = [
  { id: "1", description: "House Mortgage", categoryId: "Mortgage", unitCost: 769.65, frequency: "monthly", isActive: true },
  { id: "2", description: "House Service Charge", categoryId: "Maintenance", unitCost: 208.8, frequency: "monthly", isActive: true },
  { id: "3", description: "House Ground Rent", categoryId: "Maintenance", unitCost: 35, frequency: "monthly", isActive: true },
  { id: "4", description: "House Building Insurance", categoryId: "Maintenance", unitCost: 58.1975, frequency: "monthly", isActive: true },
  { id: "5", description: "Council Tax", categoryId: "Utilities", unitCost: 142, frequency: "monthly", isActive: true },
  { id: "6", description: "Energy (Electricity & Gas)", categoryId: "Utilities", unitCost: 56.39, frequency: "monthly", isActive: true },
  { id: "7", description: "Internet", categoryId: "Utilities", unitCost: 25, frequency: "monthly", isActive: true },
  { id: "8", description: "House Savings", categoryId: "Maintenance", unitCost: 150, frequency: "monthly", isActive: true },
  { id: "9", description: "Runescape", categoryId: "Subscriptions", unitCost: 7.99, frequency: "monthly", isActive: true },
  { id: "10", description: "Work Bus", categoryId: "Transport", unitCost: 40, frequency: "monthly", isActive: true },
  { id: "11", description: "Amazon Prime", categoryId: "Subscriptions", unitCost: 95, frequency: "yearly", isActive: true },
  { id: "12", description: "Food", categoryId: "Food", unitCost: 150, frequency: "monthly", isActive: true },
  { id: "13", description: "Eat-out", categoryId: "Personal Spending", unitCost: 80, frequency: "monthly", isActive: true },
  { id: "14", description: "Savings", categoryId: "Savings", unitCost: 300, frequency: "monthly", isActive: true },
  { id: "15", description: "Phone", categoryId: "Utilities", unitCost: 18.08, frequency: "monthly", isActive: true },
  { id: "16", description: "Gym", categoryId: "Subscriptions", unitCost: 42, frequency: "monthly", isActive: true },
  { id: "17", description: "Trading 212", categoryId: "Investment", unitCost: 300, frequency: "monthly", isActive: true },
  { id: "18", description: "PayPal PC", categoryId: "Credit", unitCost: 77.17, frequency: "monthly", isActive: true },
  { id: "19", description: "PayPal Fractal", categoryId: "Credit", unitCost: 0.01, frequency: "monthly", isActive: false }, // 0-cost line skipped (schema requires cost > 0)
  { id: "20", description: "VirginMoney", categoryId: "Credit", unitCost: 0.01, frequency: "monthly", isActive: false },
  { id: "21", description: "Boiler", categoryId: "Credit", unitCost: 94.92, frequency: "monthly", isActive: true },
  { id: "22", description: "Climbing Centre", categoryId: "Subscriptions", unitCost: 48, frequency: "monthly", isActive: true },
];

const incomeSources: IncomeSource[] = [
  {
    id: "salary",
    label: "Salary",
    source: "main_job",
    grossYearlyAmount: 51932,
    effectiveFrom: new Date("2020-01-01"),
  },
];

const summary = calculateBudgetSummary(
  incomeSources,
  expenses,
  categories,
  DEFAULT_TAX_PROFILE,
  { year: 2026, month: 5 } // June 2026 — no fixture expense has a start/end date, so every
  // frequency falls back to its steady-state smoothed contribution, which is why these
  // month-scoped figures still match the original spreadsheet's always-smoothed model exactly.
);

function categoryYearly(name: string): number {
  return summary.categories.find((c) => c.categoryName === name)?.yearly ?? NaN;
}

describe("category rollups — match Budget_2026.xlsx 'Expense Breakdown' block", () => {
  it("Mortgage yearly total (spreadsheet B3 = 9235.80)", () => {
    expect(categoryYearly("Mortgage")).toBeCloseTo(9235.8, 2);
  });

  it("Maintenance yearly total (spreadsheet B4 = 5423.97)", () => {
    expect(categoryYearly("Maintenance")).toBeCloseTo(5423.97, 2);
  });

  it("Utilities yearly total (spreadsheet B5 = 2897.64)", () => {
    expect(categoryYearly("Utilities")).toBeCloseTo(2897.64, 2);
  });

  it("Food yearly total (spreadsheet B6 = 1800.00)", () => {
    expect(categoryYearly("Food")).toBeCloseTo(1800, 2);
  });

  it("Transport yearly total (spreadsheet B7 = 480.00)", () => {
    expect(categoryYearly("Transport")).toBeCloseTo(480, 2);
  });

  it("Subscriptions yearly total (spreadsheet B8 = 1270.88)", () => {
    expect(categoryYearly("Subscriptions")).toBeCloseTo(1270.88, 2);
  });

  it("Personal Spending yearly total (spreadsheet B9 = 960.00)", () => {
    expect(categoryYearly("Personal Spending")).toBeCloseTo(960, 2);
  });

  it("Credit yearly total, excluding zero-cost lines (spreadsheet B10 = 2065.08, of which 2065.06 from active lines)", () => {
    // PayPal Fractal and VirginMoney are £0/month in the spreadsheet — modeled
    // here as inactive rather than zero-cost, since the schema requires cost > 0.
    expect(categoryYearly("Credit")).toBeCloseTo(77.17 * 12 + 94.92 * 12, 2);
  });

  it("Investment yearly total (spreadsheet B11 = 3600.00)", () => {
    expect(categoryYearly("Investment")).toBeCloseTo(3600, 2);
  });

  it("Savings yearly total (spreadsheet B12 = 3600.00)", () => {
    expect(categoryYearly("Savings")).toBeCloseTo(3600, 2);
  });

  it("Mortgage's percentage of net income (spreadsheet D3 = 0.2507054977)", () => {
    const mortgage = summary.categories.find((c) => c.categoryName === "Mortgage");
    expect(mortgage?.percentageOfIncome).toBeCloseTo(0.2507054977, 6);
  });
});

describe("remaining budget — matches Budget_2026.xlsx 'Remaining' row", () => {
  it("total yearly expenses across active lines", () => {
    // Spreadsheet J31 = 31333.37 includes the two £0/month Credit lines;
    // this fixture models them as inactive instead, so the true total here
    // is 31333.37 minus what those two zero-cost lines would have added (£0).
    expect(summary.totalYearlyExpenses).toBeCloseTo(31333.37, 1);
  });

  it("remaining as a percentage of net income (spreadsheet D14 = 0.149457)", () => {
    expect(summary.remaining.percentageOfIncome).toBeCloseTo(0.149457, 5);
  });
});

describe("multi-month recurrence — end-to-end", () => {
  const monthlyFromMarch: Expense = {
    id: "m1",
    description: "New gym membership",
    categoryId: "Subscriptions",
    unitCost: 40,
    frequency: "monthly",
    isActive: true,
    startDate: new Date("2026-03-01"),
  };
  const yearlyInSeptember: Expense = {
    id: "y1",
    description: "Car insurance",
    categoryId: "Transport",
    unitCost: 480,
    frequency: "yearly",
    isActive: true,
    startDate: new Date("2025-09-15"),
  };
  const endedInJune: Expense = {
    id: "e1",
    description: "Old streaming service",
    categoryId: "Subscriptions",
    unitCost: 10,
    frequency: "monthly",
    isActive: true,
    startDate: new Date("2020-01-01"),
    endDate: new Date("2026-06-30"),
  };

  const multiMonthExpenses = [monthlyFromMarch, yearlyInSeptember, endedInJune];

  function totalForMonth(year: number, month: number) {
    return calculateBudgetSummary(
      incomeSources,
      multiMonthExpenses,
      categories,
      DEFAULT_TAX_PROFILE,
      { year, month }
    ).totalMonthlyExpenses;
  }

  it("a monthly expense starting in March doesn't appear in January or February", () => {
    expect(totalForMonth(2026, 0)).toBeCloseTo(10, 2); // only the still-active "ended in June" one
    expect(totalForMonth(2026, 1)).toBeCloseTo(10, 2);
    expect(totalForMonth(2026, 2)).toBeCloseTo(50, 2); // +40 gym membership
  });

  it("a yearly expense only spikes the total in its billing month", () => {
    expect(totalForMonth(2026, 8)).toBeCloseTo(40 + 480, 2); // September: gym + car insurance (streaming already ended)
    expect(totalForMonth(2026, 9)).toBeCloseTo(40, 2); // October: no car insurance either
  });

  it("an expense with an end date stops contributing after that month", () => {
    expect(totalForMonth(2026, 5)).toBeCloseTo(40 + 10, 2); // June: still active
    expect(totalForMonth(2026, 6)).toBeCloseTo(40, 2); // July: streaming has ended
  });
});
