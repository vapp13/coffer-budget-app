"use client";

import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CategoryIconBadge } from "@/components/expenses/category-icon-badge";
import { ExpenseTypeBadge } from "@/components/expenses/expense-type-badge";
import { ExpenseOverflowMenu } from "@/components/expenses/expense-overflow-menu";
import { resolveExpenseType, type Expense } from "@/lib/validation/expense";

const FREQUENCY_SUFFIX: Record<Expense["frequency"], string> = {
  daily: "/ day",
  weekly: "/ wk",
  fortnightly: "/ 2wk",
  monthly: "/ month",
  quarterly: "/ qtr",
  yearly: "/ year",
};

type ExpenseItemProps = {
  expense: Expense;
  categoryName: string;
  categoryColor: string;
  formatCurrency: (value: number) => string;
  formatDate: (date: Date | undefined | null) => string;
  isEndingThisMonth?: boolean;
  isArchived?: boolean;
  onViewDetails: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
  onDelete: () => void;
};

export function ExpenseItem({
  expense,
  categoryName,
  categoryColor,
  formatCurrency,
  formatDate,
  isEndingThisMonth = false,
  isArchived = false,
  onViewDetails,
  onEdit,
  onDuplicate,
  onArchive,
  onDelete,
}: ExpenseItemProps) {
  const type = resolveExpenseType(expense);
  const isOneTime = type === "one_time";
  const frequencySuffix = isOneTime ? "" : FREQUENCY_SUFFIX[expense.frequency];
  const dateLabel = expense.startDate ? formatDate(expense.startDate) : null;
  // The type badge already says "Recurring"/"One-time" — for one-time
  // expenses, repeating that in the category line too would be redundant,
  // so it just shows the category name; recurring expenses show the
  // specific frequency here instead, which is genuinely new information.
  const secondLine = isOneTime
    ? categoryName
    : `${categoryName} · ${expense.frequency.charAt(0).toUpperCase() + expense.frequency.slice(1)}`;

  return (
    <Card
      onClick={onViewDetails}
      className="flex cursor-pointer items-center gap-3 rounded-2xl p-3 transition active:scale-[0.98]"
    >
      <CategoryIconBadge categoryName={categoryName} color={categoryColor} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-semibold">{expense.description}</p>
          <ExpenseTypeBadge type={type} />
        </div>
        <p className="truncate text-xs text-muted-foreground">{secondLine}</p>
        <div className="flex items-center gap-1.5">
          {dateLabel && <p className="text-xs text-muted-foreground">{dateLabel}</p>}
          {isEndingThisMonth && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-accent">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              Ends this month
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <div className="text-right">
          <p className="text-sm font-semibold tabular-nums">{formatCurrency(expense.unitCost)}</p>
          {frequencySuffix && <p className="text-xs text-muted-foreground">{frequencySuffix}</p>}
        </div>
        <ExpenseOverflowMenu
          isArchived={isArchived}
          onEdit={onEdit}
          onDuplicate={onDuplicate}
          onArchiveToggle={onArchive}
          onDelete={onDelete}
        />
      </div>
    </Card>
  );
}
