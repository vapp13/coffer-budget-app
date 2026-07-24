"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Sparkles, Plus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/auth-context";
import { useBudgetSummary } from "@/hooks/use-budget-summary";
import { useCategories } from "@/hooks/use-categories";
import { useExpenses } from "@/hooks/use-expenses";
import { useIncomeSources } from "@/hooks/use-income-sources";
import { useTaxProfile } from "@/hooks/use-tax-profile";
import { useAllDeductions } from "@/hooks/use-all-deductions";
import { useGoals } from "@/hooks/use-goals";
import { useFormatting } from "@/hooks/use-formatting";
import { useSelectedMonth } from "@/lib/date/month-provider";
import { buildMonthlySeries, monthRangeAround } from "@/lib/calculations/monthly-series";
import { deriveInsights } from "@/lib/insights";
import { calculateSavingsBreakdown } from "@/lib/calculations/savings";
import { MonthPicker } from "@/components/dashboard/month-picker";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { SummaryCardSkeleton } from "@/components/dashboard/summary-card-skeleton";
import { BudgetProgress } from "@/components/dashboard/budget-progress";
import { GoalsSummaryCard } from "@/components/dashboard/goals-summary-card";
import { InsightsCard } from "@/components/dashboard/insights-card";
import { CategoryPieChart } from "@/components/charts/category-pie-chart";
import { CategoryLegendCard } from "@/components/charts/category-legend-card";
import { SpendingTrendChart } from "@/components/reports/spending-trend-chart";
import { ChartSkeleton } from "@/components/charts/chart-skeleton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ExpenseForm } from "@/components/forms/expense-form";
import type { ExpenseInput } from "@/lib/validation/expense";

export default function DashboardPage() {
  const { user } = useAuth();
  const { summary, isLoading } = useBudgetSummary();
  const { data: categories } = useCategories();
  const { data: expenses, createExpense } = useExpenses();
  const { data: incomeSources } = useIncomeSources();
  const { data: goals } = useGoals();
  const { taxProfile } = useTaxProfile();
  const { deductionsBySourceId } = useAllDeductions(incomeSources);
  const { formatCurrency, locale } = useFormatting();
  const { selectedMonth } = useSelectedMonth();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const firstName = user?.displayName?.split(" ")[0];
  const colorByCategoryId = Object.fromEntries(
    (categories ?? []).map((c) => [c.id, c.color])
  );

  // Global "is there any data at all" check — deliberately unaffected by
  // which month is selected, so browsing to a month before anything started
  // doesn't wrongly show the first-run empty state.
  const hasNoData =
    !isLoading &&
    summary &&
    summary.income.gross.yearly === 0 &&
    summary.totalYearlyExpenses === 0;

  const savingsRate = summary ? calculateSavingsBreakdown(summary).savingsRate : 0;
  const remainingBudget = summary ? Math.max(0, summary.remaining.monthly) : 0;

  const trendSeries = useMemo(() => {
    if (!categories || !expenses || !incomeSources || !taxProfile) return [];
    const months = monthRangeAround(selectedMonth, 5, 0);
    return buildMonthlySeries(incomeSources, expenses, categories, taxProfile, months, locale, deductionsBySourceId);
  }, [categories, expenses, incomeSources, taxProfile, selectedMonth, locale, deductionsBySourceId]);

  async function handleAdd(input: ExpenseInput) {
    try {
      await createExpense.mutateAsync(input);
      setIsAddOpen(false);
      toast.success("Expense added");
    } catch {
      toast.error("Couldn't add that expense — try again.");
    }
  }

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Welcome back{firstName ? `, ${firstName}` : ""}.
        </p>
        <MonthPicker />
      </div>

      <Button onClick={() => setIsAddOpen(true)} className="w-full sm:w-auto sm:self-start">
        <Plus className="h-4 w-4" />
        Add expense
      </Button>

      {isLoading && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SummaryCardSkeleton key={i} />
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
        </div>
      )}

      {hasNoData && (
        <Card>
          <EmptyState
            icon={Sparkles}
            title="Let's get your budget started"
            description="Add your income and a few expenses to see your dashboard come to life."
            action={
              <div className="flex flex-wrap justify-center gap-3">
                <Button onClick={() => setIsAddOpen(true)}>Add an expense</Button>
                <Link href="/income">
                  <Button variant="outline">Add income</Button>
                </Link>
              </div>
            }
          />
        </Card>
      )}

      {!isLoading && summary && !hasNoData && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <SummaryCard
              label="Net income"
              value={summary.income.net.monthly}
              formatValue={formatCurrency}
            />
            <SummaryCard
              label="Monthly spend"
              value={summary.totalMonthlyExpenses}
              formatValue={formatCurrency}
            />
            <SummaryCard
              label="Remaining budget"
              value={summary.remaining.monthly}
              formatValue={formatCurrency}
              tone={summary.remaining.monthly >= 0 ? "positive" : "negative"}
            />
            <SummaryCard
              label="Savings rate"
              value={savingsRate * 100}
              formatValue={(v) => `${v.toFixed(1)}%`}
              info={
                <>
                  <p className="mb-1">
                    How much of your net income is being saved or left unallocated each month.
                  </p>
                  <p className="mb-1 font-medium text-foreground">
                    Formula: (Savings category spend + unallocated remaining budget) ÷ net monthly income × 100
                  </p>
                  <p>
                    This includes any expenses categorized as "Savings," plus any leftover budget
                    you haven't spent — money not spent counts as saved.
                  </p>
                </>
              }
            />
          </div>

          <BudgetProgress
            spent={summary.totalMonthlyExpenses}
            income={summary.income.net.monthly}
            formatCurrency={formatCurrency}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <CategoryPieChart
              categories={summary.categories}
              colorByCategoryId={colorByCategoryId}
              remainingBudget={remainingBudget}
            />
            <CategoryLegendCard
              categories={summary.categories}
              colorByCategoryId={colorByCategoryId}
              formatCurrency={formatCurrency}
              remainingBudget={remainingBudget}
            />
          </div>

          <SpendingTrendChart data={trendSeries} formatCurrency={formatCurrency} />

          {goals && <GoalsSummaryCard goals={goals} formatCurrency={formatCurrency} />}

          <InsightsCard insights={deriveInsights(summary)} formatCurrency={formatCurrency} />
        </>
      )}

      <Dialog open={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add an expense">
        <ExpenseForm onSubmit={handleAdd} isSubmitting={createExpense.isPending} />
      </Dialog>
    </main>
  );
}
