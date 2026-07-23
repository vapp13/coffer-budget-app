import type { Expense } from "@/lib/validation/expense";
import type { Category } from "@/lib/validation/category";
import { normalizeToYearly } from "@/lib/calculations/frequency";
import { round2 } from "@/lib/calculations/math-helpers";

/** Expenses that are marked active and, if dated, cover the given date. */
export function activeExpenses(
  expenses: Expense[],
  asOf: Date = new Date()
): Expense[] {
  return expenses.filter((expense) => {
    if (!expense.isActive) return false;
    const started = !expense.startDate || expense.startDate <= asOf;
    const notEnded = !expense.endDate || expense.endDate >= asOf;
    return started && notEnded;
  });
}

export function expenseYearlyTotal(expense: Expense): number {
  return normalizeToYearly(expense.unitCost, expense.frequency);
}

export function totalYearlyExpenses(expenses: Expense[]): number {
  return round2(expenses.reduce((sum, e) => sum + expenseYearlyTotal(e), 0));
}

export type CategoryTotal = {
  categoryId: string;
  categoryName: string;
  yearly: number;
  monthly: number;
  /** Share of net yearly income this category consumes (0–1). */
  percentageOfIncome: number;
};

/**
 * Per-category yearly/monthly totals and percentage of net income.
 * Mirrors columns A–D of the spreadsheet's "Expense Breakdown" block
 * (SUMIF by category, ÷12 for monthly, ÷ net yearly income for percentage).
 */
export function categoryTotals(
  expenses: Expense[],
  categories: Category[],
  netYearlyIncome: number
): CategoryTotal[] {
  return categories.map((category) => {
    const yearly = round2(
      expenses
        .filter((e) => e.categoryId === category.id)
        .reduce((sum, e) => sum + expenseYearlyTotal(e), 0)
    );
    return {
      categoryId: category.id,
      categoryName: category.name,
      yearly,
      monthly: round2(yearly / 12),
      percentageOfIncome: netYearlyIncome === 0 ? 0 : yearly / netYearlyIncome,
    };
  });
}
