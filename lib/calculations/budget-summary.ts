import type { Expense } from "@/lib/validation/expense";
import type { Category } from "@/lib/validation/category";
import type { IncomeSource } from "@/lib/validation/income-source";
import type { TaxProfileInput } from "@/lib/validation/tax-profile";
import { calculateIncomeBreakdown, type IncomeBreakdown } from "@/lib/calculations/income-tax";
import { totalGrossYearlyIncomeForMonth } from "@/lib/calculations/income-sources";
import {
  totalYearlyExpenseRate,
  totalExpensesForMonth,
  categoryTotalsForMonth,
  type CategoryTotal,
} from "@/lib/calculations/expenses";
import { round2 } from "@/lib/calculations/math-helpers";
import type { MonthKey } from "@/lib/date/month";

export type BudgetSummary = {
  income: IncomeBreakdown;
  /** Sum of every expense's annualized rate — a steady reference figure, unaffected by the selected month. */
  totalYearlyExpenses: number;
  /** What's actually incurred in the selected month, based on each expense's real recurrence. */
  totalMonthlyExpenses: number;
  categories: CategoryTotal[];
  remaining: {
    monthly: number;
    percentageOfIncome: number;
  };
};

/**
 * The full picture for one specific calendar month: net/gross income from
 * whichever income sources are active that month, every category's actual
 * spend that month (via the recurrence engine — a yearly bill only counts
 * in its billing month), and what's left over.
 */
export function calculateBudgetSummary(
  incomeSources: IncomeSource[],
  expenses: Expense[],
  categories: Category[],
  taxProfile: TaxProfileInput,
  selectedMonth: MonthKey
): BudgetSummary {
  const yearlyGross = totalGrossYearlyIncomeForMonth(incomeSources, selectedMonth);
  const income = calculateIncomeBreakdown(yearlyGross, taxProfile);
  const netMonthly = income.net.monthly;

  const monthlyExpenses = totalExpensesForMonth(expenses, selectedMonth);

  return {
    income,
    totalYearlyExpenses: totalYearlyExpenseRate(expenses),
    totalMonthlyExpenses: monthlyExpenses,
    categories: categoryTotalsForMonth(expenses, categories, selectedMonth, netMonthly),
    remaining: {
      monthly: round2(netMonthly - monthlyExpenses),
      percentageOfIncome: netMonthly === 0 ? 0 : (netMonthly - monthlyExpenses) / netMonthly,
    },
  };
}
