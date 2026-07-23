"use client";

import type { MouseEvent } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { INCOME_SOURCE_TYPE_LABELS, resolveIncomeSourceType } from "@/lib/validation/income-source";
import type { IncomeSource } from "@/lib/validation/income-source";

type IncomeItemProps = {
  income: IncomeSource;
  formatCurrency: (value: number) => string;
  variant?: "list" | "card";
  onViewDetails: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function IncomeItem({
  income,
  formatCurrency,
  variant = "list",
  onViewDetails,
  onEdit,
  onDelete,
}: IncomeItemProps) {
  function stopAnd(handler: () => void) {
    return (event: MouseEvent) => {
      event.stopPropagation();
      handler();
    };
  }

  const content = (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{income.label}</p>
        <p className="truncate text-xs text-muted-foreground">
          {INCOME_SOURCE_TYPE_LABELS[resolveIncomeSourceType(income)]}
        </p>
      </div>
      <span className="shrink-0 text-sm font-medium tabular-nums">
        {formatCurrency(income.grossYearlyAmount)}
      </span>
    </div>
  );

  const actions = (
    <div className="flex shrink-0 items-center gap-1">
      <Button
        variant="ghost"
        onClick={stopAnd(onEdit)}
        aria-label={`Edit ${income.label}`}
        className="px-2"
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        onClick={stopAnd(onDelete)}
        aria-label={`Remove ${income.label}`}
        className="px-2"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );

  if (variant === "card") {
    return (
      <Card
        onClick={onViewDetails}
        className="flex cursor-pointer flex-col gap-3 transition hover:shadow-md"
      >
        {content}
        <div className="flex justify-end border-t border-border pt-2">{actions}</div>
      </Card>
    );
  }

  return (
    <li
      onClick={onViewDetails}
      className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
    >
      {content}
      {actions}
    </li>
  );
}
