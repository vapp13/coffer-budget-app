"use client";

import { Sparkles, PencilLine } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { useDeductions } from "@/hooks/use-deductions";
import { useTaxProfile } from "@/hooks/use-tax-profile";
import { calculateIncomeSourceBreakdown } from "@/lib/calculations/income-sources";
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
  const { data: deductions } = useDeductions(income?.id);
  const { taxProfile } = useTaxProfile();

  if (!income || !taxProfile) return null;

  // Reuses the exact same function the calculation engine uses for net
  // income, so what's shown here always matches the dashboard/reports.
  const breakdown = calculateIncomeSourceBreakdown(income, deductions ?? [], taxProfile);

  const rows: [string, string][] = [
    ["Label", income.label],
    ["Source", INCOME_SOURCE_TYPE_LABELS[resolveIncomeSourceType(income)]],
    ["Source details", income.sourceDetails || "—"],
    ["Gross yearly amount", formatCurrency(income.grossYearlyAmount)],
    ["Gross monthly", formatCurrency(income.grossYearlyAmount / 12)],
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

      <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
        <h3 className="text-sm font-medium">Deductions</h3>
        <ul className="divide-y divide-border">
          {breakdown.deductionLines.map((line, index) => {
            const grossMonthly = income.grossYearlyAmount / 12;
            const percentageOfGross = grossMonthly > 0 ? (line.amount / grossMonthly) * 100 : 0;
            return (
              <li key={index} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate">{line.label}</span>
                    {line.source === "manual" ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400">
                        <PencilLine className="h-3 w-3" />
                        Manual
                      </span>
                    ) : (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-medium text-accent">
                        <Sparkles className="h-3 w-3" />
                        Automatic estimate
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{percentageOfGross.toFixed(1)}% of gross income</p>
                </div>
                <span className="shrink-0 font-medium tabular-nums">{formatCurrency(line.amount)}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-2 flex flex-col divide-y divide-border border-t border-border pt-2">
        <div className="flex items-center justify-between gap-4 py-2.5">
          <dt className="text-sm text-muted-foreground">Total deductions (monthly)</dt>
          <dd className="text-sm font-medium tabular-nums">{formatCurrency(breakdown.deductionsYearly / 12)}</dd>
        </div>
        <div className="flex items-center justify-between gap-4 py-2.5">
          <dt className="text-sm font-medium">Net income (monthly)</dt>
          <dd className="text-base font-semibold tabular-nums text-primary">
            {formatCurrency(breakdown.netYearly / 12)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4 py-2.5">
          <dt className="text-sm font-medium">Net income (yearly)</dt>
          <dd className="text-sm font-semibold tabular-nums text-primary">
            {formatCurrency(breakdown.netYearly)}
          </dd>
        </div>
      </div>
    </Dialog>
  );
}
