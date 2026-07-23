"use client";

import { Dialog } from "@/components/ui/dialog";
import { INCOME_SOURCE_TYPE_LABELS, resolveIncomeSourceType } from "@/lib/validation/income-source";
import type { IncomeSource } from "@/lib/validation/income-source";

type IncomeDetailsModalProps = {
  income: IncomeSource | null;
  formatCurrency: (value: number) => string;
  formatDate: (date: Date | undefined | null) => string;
  onClose: () => void;
};

export function IncomeDetailsModal({
  income,
  formatCurrency,
  formatDate,
  onClose,
}: IncomeDetailsModalProps) {
  if (!income) return null;

  const rows: [string, string][] = [
    ["Label", income.label],
    ["Source", INCOME_SOURCE_TYPE_LABELS[resolveIncomeSourceType(income)]],
    ["Source details", income.sourceDetails || "—"],
    ["Gross yearly amount", formatCurrency(income.grossYearlyAmount)],
    ["Gross monthly (calculated)", formatCurrency(income.grossYearlyAmount / 12)],
    ["Effective from", formatDate(income.effectiveFrom)],
    ["Effective to", income.effectiveTo ? formatDate(income.effectiveTo) : "—"],
  ];

  return (
    <Dialog open={!!income} onClose={onClose} title="Income details">
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
