"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deductionDisplayLabel, type Deduction } from "@/lib/validation/deduction";

type DeductionRowProps = {
  deduction: Deduction;
  percentageOfGross: number;
  formatCurrency: (value: number) => string;
  onEdit: () => void;
  onDelete: () => void;
};

export function DeductionRow({
  deduction,
  percentageOfGross,
  formatCurrency,
  onEdit,
  onDelete,
}: DeductionRowProps) {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{deductionDisplayLabel(deduction)}</p>
        <p className="truncate text-xs text-muted-foreground">
          {percentageOfGross.toFixed(1)}% of gross
          {deduction.notes ? ` · ${deduction.notes}` : ""}
        </p>
      </div>
      <span className="shrink-0 text-sm font-medium tabular-nums">
        {formatCurrency(deduction.amount)}
      </span>
      <Button variant="ghost" onClick={onEdit} aria-label="Edit deduction" className="shrink-0 px-2">
        <Pencil className="h-4 w-4" />
      </Button>
      <Button variant="ghost" onClick={onDelete} aria-label="Remove deduction" className="shrink-0 px-2">
        <Trash2 className="h-4 w-4" />
      </Button>
    </li>
  );
}
