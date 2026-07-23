import type { Expense } from "@/lib/validation/expense";
import type { Category } from "@/lib/validation/category";
import type { IncomeSource } from "@/lib/validation/income-source";
import type { Deduction } from "@/lib/validation/deduction";
import type { TaxProfileInput } from "@/lib/validation/tax-profile";
import { calculateBudgetSummary } from "@/lib/calculations/budget-summary";
import { addMonths, monthShortLabel, type MonthKey } from "@/lib/date/month";

export type MonthlyDataPoint = {
  month: MonthKey;
  label: string;
  income: number;
  expenses: number;
  remaining: number;
};

/** `before` and `after` months around (and including) `center`, in order. */
export function monthRangeAround(center: MonthKey, before: number, after: number): MonthKey[] {
  const months: MonthKey[] = [];
  for (let i = -before; i <= after; i++) {
    months.push(addMonths(center, i));
  }
  return months;
}

/**
 * Runs the same month-scoped calculation engine across a list of months —
 * so a "trend" (past months) and a "forecast" (future months) are exactly
 * the same operation, just pointed at different MonthKeys. Nothing here is
 * a statistical projection; a future month's figures are simply what's
 * already scheduled to happen per the current recurring entries.
 */
export function buildMonthlySeries(
  incomeSources: IncomeSource[],
  expenses: Expense[],
  categories: Category[],
  taxProfile: TaxProfileInput,
  months: MonthKey[],
  locale = "en-GB",
  deductionsBySourceId: Record<string, Deduction[]> = {}
): MonthlyDataPoint[] {
  return months.map((month) => {
    const summary = calculateBudgetSummary(
      incomeSources,
      expenses,
      categories,
      taxProfile,
      month,
      deductionsBySourceId
    );
    return {
      month,
      label: monthShortLabel(month, locale),
      income: summary.income.net.monthly,
      expenses: summary.totalMonthlyExpenses,
      remaining: summary.remaining.monthly,
    };
  });
}
