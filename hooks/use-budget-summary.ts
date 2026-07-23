"use client";

import { useMemo } from "react";
import { useCategories } from "@/hooks/use-categories";
import { useExpenses } from "@/hooks/use-expenses";
import { useIncomeSources } from "@/hooks/use-income-sources";
import { useTaxProfile } from "@/hooks/use-tax-profile";
import { useAllDeductions } from "@/hooks/use-all-deductions";
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
  const { deductionsBySourceId, isLoading: deductionsLoading } = useAllDeductions(incomeSources);
  const { selectedMonth } = useSelectedMonth();

  const isLoading =
    categoriesLoading || expensesLoading || incomeLoading || taxProfileLoading || deductionsLoading;

  const summary = useMemo(() => {
    if (!categories || !expenses || !incomeSources || !taxProfile) return undefined;
    return calculateBudgetSummary(
      incomeSources,
      expenses,
      categories,
      taxProfile,
      selectedMonth,
      deductionsBySourceId
    );
  }, [categories, expenses, incomeSources, taxProfile, selectedMonth, deductionsBySourceId]);

  return { summary, isLoading };
}
