"use client";

import { useBudgetSummary } from "@/hooks/use-budget-summary";
import { useCategories } from "@/hooks/use-categories";
import { CategoryPieChart } from "@/components/charts/category-pie-chart";
import { IncomeVsExpensesChart } from "@/components/charts/income-vs-expenses-chart";

export default function InsightsPage() {
  const { summary, isLoading } = useBudgetSummary();
  const { data: categories } = useCategories();

  const colorByCategoryId = Object.fromEntries(
    (categories ?? []).map((c) => [c.id, c.color])
  );

  // "Investment" matched by name for now — see improvement note in
  // Milestone 3 about adding a dedicated category `type` field.
  const investmentShare =
    summary?.categories.find((c) => c.categoryName === "Investment")?.percentageOfIncome ?? 0;

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-8">
      <div>
        <h1 className="font-display text-xl font-semibold">Insights</h1>
        <p className="text-sm text-muted-foreground">
          Spending analysis and trends.
        </p>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {!isLoading && summary && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <CategoryPieChart
              categories={summary.categories}
              colorByCategoryId={colorByCategoryId}
            />
            <IncomeVsExpensesChart
              netMonthlyIncome={summary.income.net.monthly}
              monthlyExpenses={summary.totalMonthlyExpenses}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Investment rate: {(investmentShare * 100).toFixed(1)}% of net income.
          </p>
        </>
      )}
    </main>
  );
}
