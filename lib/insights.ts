import type { BudgetSummary } from "@/lib/calculations/budget-summary";
import { calculateSavingsBreakdown } from "@/lib/calculations/savings";

export type Insight =
  | { kind: "over-budget"; categoryNames: string[] }
  | { kind: "ending-soon"; expenseNames: string[] }
  | { kind: "largest-category"; categoryName: string; percentage: number }
  | { kind: "overspend"; amount: number }
  | { kind: "buffer"; percentage: number }
  | { kind: "savings-low" }
  | { kind: "savings-unallocated" }
  | { kind: "savings-good" };

/**
 * Lightweight, rule-based observations computed entirely from the current
 * month's summary — no historical data required. Capped at 3 so the card
 * stays scannable rather than becoming a wall of text.
 */
export function deriveInsights(summary: BudgetSummary): Insight[] {
  const insights: Insight[] = [];

  // Over-budget categories and expenses ending soon are the most actionable
  // observations, so they're checked (and shown) first.
  const overBudgetCategories = summary.categories.filter(
    (c) => c.monthlyBudget !== undefined && c.monthlyBudget > 0 && c.monthly > c.monthlyBudget
  );
  if (overBudgetCategories.length > 0) {
    insights.push({
      kind: "over-budget",
      categoryNames: overBudgetCategories.map((c) => c.categoryName),
    });
  }

  if (summary.endingSoonExpenses.length > 0) {
    insights.push({ kind: "ending-soon", expenseNames: summary.endingSoonExpenses });
  }

  const spendingCategories = summary.categories.filter((c) => c.yearly > 0);
  const largest = spendingCategories.reduce<(typeof spendingCategories)[number] | null>(
    (max, c) => (!max || c.yearly > max.yearly ? c : max),
    null
  );
  if (largest) {
    insights.push({
      kind: "largest-category",
      categoryName: largest.categoryName,
      percentage: largest.percentageOfIncome * 100,
    });
  }

  if (summary.remaining.monthly < 0) {
    insights.push({ kind: "overspend", amount: Math.abs(summary.remaining.monthly) });
  } else if (summary.remaining.percentageOfIncome > 0.3) {
    insights.push({ kind: "buffer", percentage: summary.remaining.percentageOfIncome * 100 });
  }

  // Savings: exactly one of these three fires, derived from the single
  // unified savings-rate calculation (see lib/calculations/savings.ts) so
  // this always agrees with the Savings Rate card and the Breakdown page.
  const savings = calculateSavingsBreakdown(summary);
  const hasSavingsCategorySpend = savings.savingsCategoryMonthly > 0;
  const remainingShare = summary.remaining.percentageOfIncome;

  if (!hasSavingsCategorySpend && remainingShare >= 0.1) {
    // Case 2: the numbers look fine, but only because money is going
    // unallocated, not because it's actually been put toward savings.
    insights.push({ kind: "savings-unallocated" });
  } else if (savings.savingsRate < 0.1) {
    insights.push({ kind: "savings-low" });
  } else {
    insights.push({ kind: "savings-good" });
  }

  return insights.slice(0, 3);
}
