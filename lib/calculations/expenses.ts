import type { Expense } from "@/lib/validation/expense";
import { resolveExpenseType } from "@/lib/validation/expense";
import type { Category } from "@/lib/validation/category";
import { normalizeToYearly } from "@/lib/calculations/frequency";
import { expenseAmountForMonth } from "@/lib/calculations/recurrence";
import { round2 } from "@/lib/calculations/math-helpers";
import type { MonthKey } from "@/lib/date/month";

/**
 * The annualized run-rate for a single expense (e.g. a £10/week expense's
 * yearly total is £520) — a property of the recurring rule itself, not of
 * any particular month. Used for CSV export's "Total Yearly" column and
 * the category breakdown's reference "yearly" figure; unaffected by which
 * month is selected.
 *
 * A one-time expense doesn't repeat, so its "yearly rate" is just its own
 * cost once — frequency is ignored for these regardless of what it's set to.
 */
export function expenseYearlyTotal(expense: Expense): number {
  if (resolveExpenseType(expense) === "one_time") return expense.unitCost;
  return normalizeToYearly(expense.unitCost, expense.frequency);
}

/**
 * Monthly and yearly cost for a *recurring* expense specifically — for
 * display (the expense list/card/details views), not month-scoped
 * calculation. Monthly is always the annualized rate ÷ 12, so a monthly
 * expense's monthly cost is exactly its cost-per-occurrence, and a yearly
 * expense's monthly cost is its cost-per-occurrence ÷ 12 — matching every
 * frequency's natural conversion. Returns null for one-time expenses, which
 * aren't a recurring monthly/yearly commitment at all.
 */
export function recurringCostBreakdown(expense: Expense): { monthly: number; yearly: number } | null {
  if (resolveExpenseType(expense) === "one_time") return null;
  const yearly = normalizeToYearly(expense.unitCost, expense.frequency);
  return { monthly: round2(yearly / 12), yearly: round2(yearly) };
}

/** Sum of every active expense's annualized run-rate, regardless of month. */
export function totalYearlyExpenseRate(expenses: Expense[]): number {
  return round2(
    expenses.filter((e) => e.isActive).reduce((sum, e) => sum + expenseYearlyTotal(e), 0)
  );
}

/** What's actually incurred in the given month, across all expenses. */
export function totalExpensesForMonth(expenses: Expense[], target: MonthKey): number {
  return round2(expenses.reduce((sum, e) => sum + expenseAmountForMonth(e, target), 0));
}

export type CategoryTotal = {
  categoryId: string;
  categoryName: string;
  /** Annualized run-rate for this category — unaffected by the selected month. */
  yearly: number;
  /** What this category actually costs in the selected month (0 if nothing in it occurs this month). */
  monthly: number;
  /** This category's share of the selected month's net income (0–1). */
  percentageOfIncome: number;
  /** The category's optional monthly spending limit, if one is set. */
  monthlyBudget?: number;
};

/**
 * Per-category totals for a specific month. "monthly" reflects real
 * occurrences that month (a yearly bill shows up as a spike in its billing
 * month and £0 elsewhere), while "yearly" stays the steady annualized rate
 * for reference.
 */
export function categoryTotalsForMonth(
  expenses: Expense[],
  categories: Category[],
  target: MonthKey,
  netMonthlyIncome: number
): CategoryTotal[] {
  return categories.map((category) => {
    const categoryExpenses = expenses.filter((e) => e.categoryId === category.id && e.isActive);
    const monthly = round2(
      categoryExpenses.reduce((sum, e) => sum + expenseAmountForMonth(e, target), 0)
    );
    const yearly = round2(
      categoryExpenses.reduce((sum, e) => sum + expenseYearlyTotal(e), 0)
    );
    return {
      categoryId: category.id,
      categoryName: category.name,
      yearly,
      monthly,
      percentageOfIncome: netMonthlyIncome === 0 ? 0 : monthly / netMonthlyIncome,
      monthlyBudget: category.monthlyBudget,
    };
  });
}
