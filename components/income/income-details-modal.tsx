"use client";

import { Sparkles, PencilLine } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { useDeductions } from "@/hooks/use-deductions";
import { useTaxProfile } from "@/hooks/use-tax-profile";
import {
  calculateMonthlyIncomeTax,
  calculateMonthlyNationalInsurance,
  calculateMonthlyPension,
} from "@/lib/calculations/income-tax";
import { deductionDisplayLabel } from "@/lib/validation/deduction";
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

  if (!income) return null;

  const hasManualDeductions = (deductions?.length ?? 0) > 0;

  const automaticRows = taxProfile
    ? [
        { label: "Income Tax (PAYE, estimated)", amount: calculateMonthlyIncomeTax(income.grossYearlyAmount, taxProfile) },
        { label: "National Insurance (estimated)", amount: calculateMonthlyNationalInsurance(income.grossYearlyAmount, taxProfile) },
        { label: "Pension (estimated)", amount: calculateMonthlyPension(income.grossYearlyAmount, taxProfile) },
      ].filter((row) => row.amount > 0)
    : [];

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

      <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
        <h3 className="text-sm font-medium">Deductions</h3>

        {hasManualDeductions ? (
          <ul className="divide-y divide-border rounded-md border border-border">
            {deductions!.map((deduction) => (
              <li key={deduction.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate">{deductionDisplayLabel(deduction)}</span>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400">
                    <PencilLine className="h-3 w-3" />
                    Manual
                  </span>
                </div>
                <span className="shrink-0 font-medium tabular-nums">{formatCurrency(deduction.amount)}</span>
              </li>
            ))}
          </ul>
        ) : automaticRows.length > 0 ? (
          <ul className="divide-y divide-border rounded-md border border-border">
            {automaticRows.map((row) => (
              <li key={row.label} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate">{row.label}</span>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-medium text-accent">
                    <Sparkles className="h-3 w-3" />
                    Automatic estimate
                  </span>
                </div>
                <span className="shrink-0 font-medium tabular-nums">{formatCurrency(row.amount)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No deductions.</p>
        )}
      </div>
    </Dialog>
  );
}
