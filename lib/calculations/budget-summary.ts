import type { Expense } from "@/lib/validation/expense";
import type { Category } from "@/lib/validation/category";
import type { IncomeSource } from "@/lib/validation/income-source";
import type { TaxProfileInput } from "@/lib/validation/tax-profile";
import { calculateIncomeBreakdown, type IncomeBreakdown } from "@/lib/calculations/income-tax";
import { totalActiveGrossYearlyIncome } from "@/lib/calculations/income-sources";
import { activeExpenses, totalYearlyExpenses, categoryTotals, type CategoryTotal } from "@/lib/calculations/expenses";
import { round2 } from "@/lib/calculations/math-helpers";

export type BudgetSummary = {
  income: IncomeBreakdown;
  totalYearlyExpenses: number;
  totalMonthlyExpenses: number;
  categories: CategoryTotal[];
  remaining: {
    yearly: number;
    monthly: number;
    percentageOfIncome: number;
  };
};

/**
 * The full picture for one point in time: net/gross income broken down by
 * time unit, every category's yearly/monthly total and % of income, and
 * what's left over after expenses — mirroring the spreadsheet's
 * "Remaining" row (`=A31-J31`, then ÷12, then ÷A31 for percentage).
 */
export function calculateBudgetSummary(
  incomeSources: IncomeSource[],
  expenses: Expense[],
  categories: Category[],
  taxProfile: TaxProfileInput,
  asOf: Date = new Date()
): BudgetSummary {
  const yearlyGross = totalActiveGrossYearlyIncome(incomeSources, asOf);
  const income = calculateIncomeBreakdown(yearlyGross, taxProfile);

  const relevantExpenses = activeExpenses(expenses, asOf);
  const yearlyExpenses = totalYearlyExpenses(relevantExpenses);
  const netYearly = income.net.yearly;

  return {
    income,
    totalYearlyExpenses: yearlyExpenses,
    totalMonthlyExpenses: round2(yearlyExpenses / 12),
    categories: categoryTotals(relevantExpenses, categories, netYearly),
    remaining: {
      yearly: round2(netYearly - yearlyExpenses),
      monthly: round2((netYearly - yearlyExpenses) / 12),
      percentageOfIncome: netYearly === 0 ? 0 : (netYearly - yearlyExpenses) / netYearly,
    },
  };
}
