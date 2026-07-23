"use client";

import { Dialog } from "@/components/ui/dialog";
import { expenseYearlyTotal } from "@/lib/calculations/expenses";
import type { Expense } from "@/lib/validation/expense";

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

  const rows: [string, string][] = [
    ["Description", expense.description],
    ["Category", categoryName],
    ["Amount", formatCurrency(expense.unitCost)],
    ["Frequency", expense.frequency.charAt(0).toUpperCase() + expense.frequency.slice(1)],
    ["Start date", expense.startDate ? formatDate(expense.startDate) : "—"],
    ["End date", expense.endDate ? formatDate(expense.endDate) : "—"],
    ["Notes", expense.notes || "—"],
    ["Calculated yearly total", formatCurrency(expenseYearlyTotal(expense))],
    ["Status", expense.isActive ? "Active" : "Inactive"],
  ];

  return (
    <Dialog open={!!expense} onClose={onClose} title="Expense details">
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
