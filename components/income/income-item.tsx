"use client";

import { Card } from "@/components/ui/card";
import { IconBadge } from "@/components/ui/icon-badge";
import { IncomeStatusBadge } from "@/components/income/income-status-badge";
import { IncomeOverflowMenu } from "@/components/income/income-overflow-menu";
import { getIncomeSourceStyle } from "@/lib/income-source-icons";
import { INCOME_SOURCE_TYPE_LABELS, resolveIncomeSourceType } from "@/lib/validation/income-source";
import type { IncomeSource } from "@/lib/validation/income-source";

type IncomeItemProps = {
  income: IncomeSource;
  formatCurrency: (value: number) => string;
  formatDate: (date: Date | undefined | null) => string;
  onViewDetails: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
};

export function IncomeItem({
  income,
  formatCurrency,
  formatDate,
  onViewDetails,
  onEdit,
  onDuplicate,
  onDelete,
}: IncomeItemProps) {
  const type = resolveIncomeSourceType(income);
  const { icon, color } = getIncomeSourceStyle(type);
  const today = new Date();
  const isActive = !income.effectiveTo || income.effectiveTo >= today;
  const dateLine = isActive
    ? `Since ${formatDate(income.effectiveFrom)}`
    : `Ended ${formatDate(income.effectiveTo)}`;

  return (
    <Card
      onClick={onViewDetails}
      className="flex cursor-pointer items-center gap-3 rounded-2xl p-3 transition active:scale-[0.98]"
    >
      <IconBadge icon={icon} color={color} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-semibold">{income.label}</p>
          <IncomeStatusBadge active={isActive} />
        </div>
        <p className="truncate text-xs text-muted-foreground">{INCOME_SOURCE_TYPE_LABELS[type]}</p>
        <p className="text-xs text-muted-foreground">{dateLine}</p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <div className="text-right">
          <p className="text-sm font-semibold tabular-nums">{formatCurrency(income.grossYearlyAmount)}</p>
          <p className="text-xs text-muted-foreground">/ year</p>
        </div>
        <IncomeOverflowMenu onEdit={onEdit} onDuplicate={onDuplicate} onDelete={onDelete} />
      </div>
    </Card>
  );
}
