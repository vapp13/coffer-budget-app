import type { Expense } from "@/lib/validation/expense";
import type { Category } from "@/lib/validation/category";
import type { IncomeSource } from "@/lib/validation/income-source";
import type { Deduction } from "@/lib/validation/deduction";
import type { TaxProfileInput } from "@/lib/validation/tax-profile";
import type { IncomeBreakdown } from "@/lib/calculations/income-tax";
import { calculateCombinedIncomeForMonth, type IncomeSourceBreakdown } from "@/lib/calculations/income-sources";
import {
  totalYearlyExpenseRate,
  totalExpensesForMonth,
  categoryTotalsForMonth,
  type CategoryTotal,
} from "@/lib/calculations/expenses";
import { isEndingThisMonth } from "@/lib/calculations/archive-logic";
import { round2 } from "@/lib/calculations/math-helpers";
import type { MonthKey } from "@/lib/date/month";

export type BudgetSummary = {
  income: IncomeBreakdown;
  /** Per-source detail — which sources used manual deductions vs the automatic estimate. */
  incomeSources: IncomeSourceBreakdown[];
  /** Sum of every expense's annualized rate — a steady reference figure, unaffected by the selected month. */
  totalYearlyExpenses: number;
  /** What's actually incurred in the selected month, based on each expense's real recurrence. */
  totalMonthlyExpenses: number;
  categories: CategoryTotal[];
  remaining: {
    monthly: number;
    percentageOfIncome: number;
  };
  /** Recurring expenses whose end date falls in the selected month — they'll auto-archive after it. */
  endingSoonExpenses: string[];
};

/**
 * The full picture for one specific calendar month: net/gross income from
 * whichever income sources are active that month (each source's net using
 * its own manual deductions if entered, otherwise the automatic estimate),
 * every category's actual spend that month (via the recurrence engine — a
 * yearly bill only counts in its billing month), and what's left over.
 */
export function calculateBudgetSummary(
  incomeSources: IncomeSource[],
  expenses: Expense[],
  categories: Category[],
  taxProfile: TaxProfileInput,
  selectedMonth: MonthKey,
  deductionsBySourceId: Record<string, Deduction[]> = {}
): BudgetSummary {
  const { breakdown: income, sources } = calculateCombinedIncomeForMonth(
    incomeSources,
    deductionsBySourceId,
    taxProfile,
    selectedMonth
  );
  const netMonthly = income.net.monthly;

  const monthlyExpenses = totalExpensesForMonth(expenses, selectedMonth);

  return {
    income,
    incomeSources: sources,
    totalYearlyExpenses: totalYearlyExpenseRate(expenses),
    totalMonthlyExpenses: monthlyExpenses,
    categories: categoryTotalsForMonth(expenses, categories, selectedMonth, netMonthly),
    remaining: {
      monthly: round2(netMonthly - monthlyExpenses),
      percentageOfIncome: netMonthly === 0 ? 0 : (netMonthly - monthlyExpenses) / netMonthly,
    },
    endingSoonExpenses: expenses
      .filter((expense) => isEndingThisMonth(expense, selectedMonth))
      .map((expense) => expense.description),
  };
}
