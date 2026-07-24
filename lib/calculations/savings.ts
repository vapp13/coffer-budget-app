import type { BudgetSummary } from "@/lib/calculations/budget-summary";

export type SavingsBreakdown = {
  /** What's actually in the "Savings" expense category this month. */
  savingsCategoryMonthly: number;
  /** Net income minus every expense (can be negative if overspent). */
  remainingMonthly: number;
  /** Savings category + any positive unallocated remainder — money that
   * wasn't spent counts as saved even if it isn't explicitly categorized. */
  totalSavingsMonthly: number;
  netMonthlyIncome: number;
  /** 0–1 fraction. Use this raw value for threshold comparisons; round only for display. */
  savingsRate: number;
};

/**
 * The one true "savings rate" calculation, per:
 *   Savings Rate = (Total Savings / Total Income) × 100
 * where Total Savings = Savings-category spend + any positive unallocated
 * remaining budget. Every dashboard component (summary card, breakdown,
 * insights) must derive its savings percentage from this function — never
 * recompute it locally — so they can't drift out of sync again.
 */
export function calculateSavingsBreakdown(summary: BudgetSummary): SavingsBreakdown {
  const savingsCategoryMonthly =
    summary.categories.find((c) => c.categoryName === "Savings")?.monthly ?? 0;
  const remainingMonthly = summary.remaining.monthly;
  const netMonthlyIncome = summary.income.net.monthly;

  const totalSavingsMonthly = savingsCategoryMonthly + Math.max(0, remainingMonthly);
  const savingsRate = netMonthlyIncome === 0 ? 0 : totalSavingsMonthly / netMonthlyIncome;

  return {
    savingsCategoryMonthly,
    remainingMonthly,
    totalSavingsMonthly,
    netMonthlyIncome,
    savingsRate,
  };
}
