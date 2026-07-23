"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/auth-context";
import { useBudgetSummary } from "@/hooks/use-budget-summary";
import { useCategories } from "@/hooks/use-categories";
import { useExpenses } from "@/hooks/use-expenses";
import { useFormatting } from "@/hooks/use-formatting";
import { useSelectedMonth } from "@/lib/date/month-provider";
import { expenseAmountForMonth } from "@/lib/calculations/recurrence";
import { sortItems } from "@/lib/sort";
import { deriveInsights } from "@/lib/insights";
import { MonthPicker } from "@/components/dashboard/month-picker";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { SummaryCardSkeleton } from "@/components/dashboard/summary-card-skeleton";
import { BudgetProgress } from "@/components/dashboard/budget-progress";
import { RecentTransactions, type TransactionRow } from "@/components/dashboard/recent-transactions";
import { InsightsCard } from "@/components/dashboard/insights-card";
import { CategoryPieChart } from "@/components/charts/category-pie-chart";
import { IncomeVsExpensesChart } from "@/components/charts/income-vs-expenses-chart";
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
  const { formatCurrency } = useFormatting();
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

  const savingsShare =
    summary?.categories.find((c) => c.categoryName === "Savings")?.percentageOfIncome ?? 0;

  function categoryName(categoryId: string) {
    return categories?.find((c) => c.id === categoryId)?.name ?? "Uncategorized";
  }

  const thisMonthsExpenses: TransactionRow[] = sortItems(
    (expenses ?? [])
      .map((expense) => ({ expense, amount: expenseAmountForMonth(expense, selectedMonth) }))
      .filter((row) => row.amount > 0),
    "amount-high",
    (row) => row.expense.description,
    (row) => row.amount
  )
    .slice(0, 6)
    .map((row) => ({
      id: row.expense.id,
      description: row.expense.description,
      categoryName: categoryName(row.expense.categoryId),
      amount: row.amount,
    }));

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
              value={savingsShare * 100}
              formatValue={(v) => `${v.toFixed(1)}%`}
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
            />
            <IncomeVsExpensesChart
              netMonthlyIncome={summary.income.net.monthly}
              monthlyExpenses={summary.totalMonthlyExpenses}
            />
          </div>

          <RecentTransactions
            title="This month's expenses"
            items={thisMonthsExpenses}
            formatCurrency={formatCurrency}
          />

          <InsightsCard insights={deriveInsights(summary)} formatCurrency={formatCurrency} />

          <Card className="flex flex-col gap-3">
            <h2 className="text-sm font-medium">Manage</h2>
            <div className="flex gap-4 text-sm font-medium text-primary">
              <Link href="/expenses" className="hover:underline">
                Expenses
              </Link>
              <Link href="/income" className="hover:underline">
                Income
              </Link>
              <Link href="/budgets" className="hover:underline">
                Budgets
              </Link>
              <Link href="/reports" className="hover:underline">
                Reports
              </Link>
            </div>
          </Card>
        </>
      )}

      <Dialog open={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add an expense">
        <ExpenseForm onSubmit={handleAdd} isSubmitting={createExpense.isPending} />
      </Dialog>
    </main>
  );
}
