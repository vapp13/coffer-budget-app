import type { BudgetSummary } from "@/lib/calculations/budget-summary";

export type Insight =
  | { kind: "largest-category"; categoryName: string; percentage: number }
  | { kind: "overspend"; amount: number }
  | { kind: "buffer"; percentage: number }
  | { kind: "savings-low" }
  | { kind: "savings-good" };

/**
 * Lightweight, rule-based observations computed entirely from the current
 * month's summary — no historical data required. Capped at 3 so the card
 * stays scannable rather than becoming a wall of text.
 */
export function deriveInsights(summary: BudgetSummary): Insight[] {
  const insights: Insight[] = [];

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

  const savingsShare =
    summary.categories.find((c) => c.categoryName === "Savings")?.percentageOfIncome ?? 0;
  if (savingsShare < 0.1) {
    insights.push({ kind: "savings-low" });
  } else if (savingsShare >= 0.2) {
    insights.push({ kind: "savings-good" });
  }

  return insights.slice(0, 3);
}
