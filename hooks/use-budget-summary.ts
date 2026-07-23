"use client";

import { useMemo } from "react";
import { useCategories } from "@/hooks/use-categories";
import { useExpenses } from "@/hooks/use-expenses";
import { useIncomeSources } from "@/hooks/use-income-sources";
import { useTaxProfile } from "@/hooks/use-tax-profile";
import { useSelectedMonth } from "@/lib/date/month-provider";
import { calculateBudgetSummary, type BudgetSummary } from "@/lib/calculations/budget-summary";

export function useBudgetSummary(): {
  summary: BudgetSummary | undefined;
  isLoading: boolean;
} {
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: expenses, isLoading: expensesLoading } = useExpenses();
  const { data: incomeSources, isLoading: incomeLoading } = useIncomeSources();
  const { taxProfile, isLoading: taxProfileLoading } = useTaxProfile();
  const { selectedMonth } = useSelectedMonth();

  const isLoading =
    categoriesLoading || expensesLoading || incomeLoading || taxProfileLoading;

  const summary = useMemo(() => {
    if (!categories || !expenses || !incomeSources || !taxProfile) return undefined;
    return calculateBudgetSummary(incomeSources, expenses, categories, taxProfile, selectedMonth);
  }, [categories, expenses, incomeSources, taxProfile, selectedMonth]);

  return { summary, isLoading };
}
