"use client";

import { AlertTriangle } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { expenseYearlyTotal } from "@/lib/calculations/expenses";
import { isEndingThisMonth } from "@/lib/calculations/archive-logic";
import { monthKeyFromDate } from "@/lib/date/month";
import { resolveExpenseType, EXPENSE_TYPE_LABELS, type Expense } from "@/lib/validation/expense";

type ExpenseDetailsModalProps = {
  expense: Expense | null;
  categoryName: string;
  formatCurrency: (value: number) => string;
  formatDate: (date: Date | undefined | null) => string;
  onClose: () => void;
};

export function ExpenseDetailsModal({
  expense,
  categoryName,
  formatCurrency,
  formatDate,
  onClose,
}: ExpenseDetailsModalProps) {
  if (!expense) return null;

  const type = resolveExpenseType(expense);
  const isOneTime = type === "one_time";
  const endingSoon = isEndingThisMonth(expense, monthKeyFromDate(new Date()));

  const rows: [string, string][] = [
    ["Description", expense.description],
    ["Category", categoryName],
    ["Type", EXPENSE_TYPE_LABELS[type]],
    ["Amount", formatCurrency(expense.unitCost)],
    ...(isOneTime
      ? ([["Date", expense.startDate ? formatDate(expense.startDate) : "—"]] as [string, string][])
      : ([
          ["Frequency", expense.frequency.charAt(0).toUpperCase() + expense.frequency.slice(1)],
          ["Start date", expense.startDate ? formatDate(expense.startDate) : "—"],
          ["End date", expense.endDate ? formatDate(expense.endDate) : "—"],
        ] as [string, string][])),
    ["Notes", expense.notes || "—"],
    ["Calculated yearly total", formatCurrency(expenseYearlyTotal(expense))],
    ["Status", expense.isActive ? "Active" : "Archived"],
  ];

  return (
    <Dialog open={!!expense} onClose={onClose} title="Expense details">
      {endingSoon && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-accent/40 bg-accent/10 p-3 text-sm text-accent">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>This recurring expense will end at the end of this month and will be automatically archived.</p>
        </div>
      )}
      <dl className="flex flex-col divide-y divide-border">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4 py-2.5">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="truncate text-sm font-medium">{value}</dd>
          </div>
        ))}
      </dl>
    </Dialog>
  );
}
