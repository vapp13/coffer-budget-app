"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useBudgetSummary } from "@/hooks/use-budget-summary";
import { useFormatting } from "@/hooks/use-formatting";
import { useSelectedMonth } from "@/lib/date/month-provider";
import { monthLabel } from "@/lib/date/month";
import { IncomeBreakdownTable } from "@/components/breakdown/income-breakdown-table";
import { ExpenseBreakdownTable } from "@/components/breakdown/expense-breakdown-table";
import { SavingsBreakdownCard } from "@/components/breakdown/savings-breakdown-card";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function BreakdownPage() {
  const { summary, isLoading } = useBudgetSummary();
  const { formatCurrency, locale } = useFormatting();
  const { selectedMonth } = useSelectedMonth();

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <Link
        href="/dashboard"
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <div>
        <h1 className="font-display text-xl font-semibold">Breakdown</h1>
        <p className="text-sm text-muted-foreground">
          A detailed look at income and expenses for {monthLabel(selectedMonth, locale)}.
        </p>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-4">
          <Card className="flex flex-col gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-32 w-full" />
          </Card>
          <Card className="flex flex-col gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-48 w-full" />
          </Card>
        </div>
      )}

      {!isLoading && summary && (
        <>
          <IncomeBreakdownTable income={summary.income} formatCurrency={formatCurrency} />
          <SavingsBreakdownCard summary={summary} formatCurrency={formatCurrency} />
          <ExpenseBreakdownTable
            categories={summary.categories}
            totalMonthlyExpenses={summary.totalMonthlyExpenses}
            remainingMonthly={summary.remaining.monthly}
            remainingPercentage={summary.remaining.percentageOfIncome}
            formatCurrency={formatCurrency}
          />
        </>
      )}
    </main>
  );
}
