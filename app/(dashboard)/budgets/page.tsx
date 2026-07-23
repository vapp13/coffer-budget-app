"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useCategories } from "@/hooks/use-categories";
import { useBudgetSummary } from "@/hooks/use-budget-summary";
import { useFormatting } from "@/hooks/use-formatting";
import { useSelectedMonth } from "@/lib/date/month-provider";
import { monthLabel } from "@/lib/date/month";
import { CategoryBudgetRow } from "@/components/budgets/category-budget-row";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function BudgetsPage() {
  const { data: categories, isLoading: categoriesLoading, editCategory } = useCategories();
  const { summary, isLoading: summaryLoading } = useBudgetSummary();
  const { formatCurrency, locale } = useFormatting();
  const { selectedMonth } = useSelectedMonth();

  const isLoading = categoriesLoading || summaryLoading;

  async function handleSave(categoryId: string, monthlyBudget: number | undefined) {
    const category = categories?.find((c) => c.id === categoryId);
    if (!category) return;
    try {
      await editCategory.mutateAsync({
        id: categoryId,
        input: {
          name: category.name,
          group: category.group,
          color: category.color,
          isDefault: category.isDefault,
          monthlyBudget,
        },
      });
      toast.success(monthlyBudget ? "Budget updated" : "Budget limit removed");
    } catch {
      toast.error("Couldn't update that budget — try again.");
    }
  }

  const sortedCategories = [...(categories ?? [])].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <Link
        href="/dashboard"
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <div>
        <h1 className="font-display text-xl font-semibold">Budgets</h1>
        <p className="text-sm text-muted-foreground">
          Set a monthly limit per category and track it for {monthLabel(selectedMonth, locale)}.
        </p>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="flex flex-col gap-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-2 w-full" />
            </Card>
          ))}
        </div>
      )}

      {!isLoading && (
        <div className="flex flex-col gap-3">
          {sortedCategories.map((category) => {
            const spent =
              summary?.categories.find((c) => c.categoryId === category.id)?.monthly ?? 0;
            return (
              <CategoryBudgetRow
                key={category.id}
                category={category}
                spent={spent}
                formatCurrency={formatCurrency}
                onSave={(budget) => handleSave(category.id, budget)}
                isSaving={editCategory.isPending}
              />
            );
          })}
        </div>
      )}
    </main>
  );
}
