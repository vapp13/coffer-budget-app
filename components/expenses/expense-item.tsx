"use client";

import type { MouseEvent } from "react";
import { Pencil, Trash2, Archive, ArchiveRestore, AlertTriangle, Repeat, CircleDot } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { resolveExpenseType, type Expense } from "@/lib/validation/expense";

type ExpenseItemProps = {
  expense: Expense;
  categoryName: string;
  formatCurrency: (value: number) => string;
  variant?: "list" | "card";
  isEndingThisMonth?: boolean;
  isArchived?: boolean;
  onViewDetails: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
};

export function ExpenseItem({
  expense,
  categoryName,
  formatCurrency,
  variant = "list",
  isEndingThisMonth = false,
  isArchived = false,
  onViewDetails,
  onEdit,
  onArchive,
  onDelete,
}: ExpenseItemProps) {
  function stopAnd(handler: () => void) {
    return (event: MouseEvent) => {
      event.stopPropagation();
      handler();
    };
  }

  const isOneTime = resolveExpenseType(expense) === "one_time";

  const content = (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{expense.description}</p>
        <p className="truncate text-xs text-muted-foreground">
          {categoryName} ·{" "}
          {isOneTime ? (
            <span className="inline-flex items-center gap-0.5">
              <CircleDot className="h-3 w-3" /> One-time
            </span>
          ) : (
            <span className="inline-flex items-center gap-0.5 capitalize">
              <Repeat className="h-3 w-3" /> {expense.frequency}
            </span>
          )}
        </p>
        {isEndingThisMonth && (
          <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-accent">
            <AlertTriangle className="h-3 w-3 shrink-0" />
            Ends this month
          </p>
        )}
      </div>
      <span className="shrink-0 text-sm font-medium tabular-nums">
        {formatCurrency(expense.unitCost)}
      </span>
    </div>
  );

  const actions = (
    <div className="flex shrink-0 items-center gap-1">
      {!isArchived && (
        <Button
          variant="ghost"
          onClick={stopAnd(onEdit)}
          aria-label={`Edit ${expense.description}`}
          className="px-2"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      )}
      <Button
        variant="ghost"
        onClick={stopAnd(onArchive)}
        aria-label={isArchived ? `Restore ${expense.description}` : `Archive ${expense.description}`}
        className="px-2"
      >
        {isArchived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
      </Button>
      <Button
        variant="ghost"
        onClick={stopAnd(onDelete)}
        aria-label={`Remove ${expense.description}`}
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
