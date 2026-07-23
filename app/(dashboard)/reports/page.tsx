"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useCategories } from "@/hooks/use-categories";
import { useExpenses } from "@/hooks/use-expenses";
import { useIncomeSources } from "@/hooks/use-income-sources";
import { useTaxProfile } from "@/hooks/use-tax-profile";
import { useFormatting } from "@/hooks/use-formatting";
import { useSelectedMonth } from "@/lib/date/month-provider";
import { addMonths, monthKeyFromDate, monthLabel } from "@/lib/date/month";
import { buildMonthlySeries, monthRangeAround } from "@/lib/calculations/monthly-series";
import { calculateBudgetSummary } from "@/lib/calculations/budget-summary";
import { compareValues } from "@/lib/calculations/comparison";
import { ComparisonCard } from "@/components/reports/comparison-card";
import { SpendingTrendChart } from "@/components/reports/spending-trend-chart";
import { ForecastCard } from "@/components/reports/forecast-card";
import { ChartSkeleton } from "@/components/charts/chart-skeleton";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ReportsPage() {
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: expenses, isLoading: expensesLoading } = useExpenses();
  const { data: incomeSources, isLoading: incomeLoading } = useIncomeSources();
  const { taxProfile, isLoading: taxLoading } = useTaxProfile();
  const { formatCurrency, locale } = useFormatting();
  const { selectedMonth } = useSelectedMonth();

  const isLoading = categoriesLoading || expensesLoading || incomeLoading || taxLoading;
  const hasData = categories && expenses && incomeSources && taxProfile;

  // Trend looks backward from whichever month is selected; forecast always
  // looks forward from today, regardless of what's selected — forecasting
  // from a past month wouldn't make sense.
  const trendMonths = useMemo(() => monthRangeAround(selectedMonth, 5, 0), [selectedMonth]);
  const forecastMonths = useMemo(() => {
    const today = monthKeyFromDate(new Date());
    return [addMonths(today, 1), addMonths(today, 2), addMonths(today, 3)];
  }, []);

  const trendSeries = useMemo(() => {
    if (!hasData) return [];
    return buildMonthlySeries(incomeSources, expenses, categories, taxProfile, trendMonths, locale);
  }, [hasData, incomeSources, expenses, categories, taxProfile, trendMonths, locale]);

  const forecastSeries = useMemo(() => {
    if (!hasData) return [];
    return buildMonthlySeries(incomeSources, expenses, categories, taxProfile, forecastMonths, locale);
  }, [hasData, incomeSources, expenses, categories, taxProfile, forecastMonths, locale]);

  const monthOverMonth = useMemo(() => {
    if (!hasData) return null;
    const current = calculateBudgetSummary(incomeSources, expenses, categories, taxProfile, selectedMonth);
    const previous = calculateBudgetSummary(
      incomeSources,
      expenses,
      categories,
      taxProfile,
      addMonths(selectedMonth, -1)
    );
    return compareValues(current.totalMonthlyExpenses, previous.totalMonthlyExpenses);
  }, [hasData, incomeSources, expenses, categories, taxProfile, selectedMonth]);

  const yearOverYear = useMemo(() => {
    if (!hasData) return null;
    const current = calculateBudgetSummary(incomeSources, expenses, categories, taxProfile, selectedMonth);
    const previous = calculateBudgetSummary(
      incomeSources,
      expenses,
      categories,
      taxProfile,
      addMonths(selectedMonth, -12)
    );
    return compareValues(current.totalMonthlyExpenses, previous.totalMonthlyExpenses);
  }, [hasData, incomeSources, expenses, categories, taxProfile, selectedMonth]);

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
        <h1 className="font-display text-xl font-semibold">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Trends, comparisons, and a look ahead, based on {monthLabel(selectedMonth, locale)}.
        </p>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="flex flex-col gap-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-32" />
            </Card>
            <Card className="flex flex-col gap-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-32" />
            </Card>
          </div>
          <ChartSkeleton />
        </div>
      )}

      {!isLoading && monthOverMonth && yearOverYear && (
        <div className="grid gap-4 sm:grid-cols-2">
          <ComparisonCard title="Vs. last month" comparison={monthOverMonth} formatCurrency={formatCurrency} />
          <ComparisonCard title="Vs. same month last year" comparison={yearOverYear} formatCurrency={formatCurrency} />
        </div>
      )}

      {!isLoading && trendSeries.length > 0 && (
        <SpendingTrendChart data={trendSeries} formatCurrency={formatCurrency} />
      )}

      {!isLoading && forecastSeries.length > 0 && (
        <ForecastCard data={forecastSeries} formatCurrency={formatCurrency} />
      )}
    </main>
  );
}
