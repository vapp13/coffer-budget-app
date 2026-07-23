"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/validation/category";

type CategoryBudgetRowProps = {
  category: Category;
  spent: number;
  formatCurrency: (value: number) => string;
  onSave: (budget: number | undefined) => void;
  isSaving?: boolean;
};

export function CategoryBudgetRow({
  category,
  spent,
  formatCurrency,
  onSave,
  isSaving,
}: CategoryBudgetRowProps) {
  const [value, setValue] = useState(category.monthlyBudget?.toString() ?? "");

  const budget = category.monthlyBudget;
  const ratio = budget && budget > 0 ? spent / budget : 0;
  const percentage = Math.min(Math.max(ratio, 0), 1) * 100;
  const isOver = !!budget && spent > budget;

  function commit() {
    const trimmed = value.trim();
    if (trimmed === "") {
      if (budget !== undefined) onSave(undefined);
      return;
    }
    const parsed = parseFloat(trimmed);
    if (Number.isFinite(parsed) && parsed > 0 && parsed !== budget) {
      onSave(parsed);
    } else if (!Number.isFinite(parsed) || parsed <= 0) {
      // Invalid entry — revert to the last saved value rather than silently accepting it.
      setValue(budget?.toString() ?? "");
    }
  }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: category.color }}
          />
          <p className="truncate text-sm font-medium">{category.name}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-xs text-muted-foreground">Limit</span>
          <Input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                commit();
                (event.target as HTMLInputElement).blur();
              }
            }}
            placeholder="No limit"
            inputMode="decimal"
            disabled={isSaving}
            className="min-h-[36px] w-24 py-1 text-right"
          />
        </div>
      </div>

      {budget !== undefined ? (
        <>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-[width] duration-500",
                isOver ? "bg-negative" : "bg-primary"
              )}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="tabular-nums">
              {formatCurrency(spent)} of {formatCurrency(budget)}
            </span>
            {isOver && (
              <span className="flex items-center gap-1 font-medium text-negative">
                <AlertTriangle className="h-3.5 w-3.5" />
                Over by {formatCurrency(spent - budget)}
              </span>
            )}
          </div>
        </>
      ) : (
        <p className="text-xs text-muted-foreground">
          {formatCurrency(spent)} spent this month · no limit set
        </p>
      )}
    </Card>
  );
}
