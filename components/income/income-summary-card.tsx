import { Card } from "@/components/ui/card";
import { round2 } from "@/lib/calculations/math-helpers";
import type { IncomeSource } from "@/lib/validation/income-source";

type IncomeSummaryCardProps = {
  incomeSources: IncomeSource[];
  formatCurrency: (value: number) => string;
};

export function IncomeSummaryCard({ incomeSources, formatCurrency }: IncomeSummaryCardProps) {
  const yearlyTotal = round2(incomeSources.reduce((sum, i) => sum + i.grossYearlyAmount, 0));
  const monthlyTotal = round2(yearlyTotal / 12);

  return (
    <Card className="flex items-center justify-between rounded-2xl">
      <div>
        <p className="text-xs text-muted-foreground">Gross Monthly Total</p>
        <p className="font-display text-xl font-semibold tabular-nums">{formatCurrency(monthlyTotal)}</p>
      </div>
      <div className="text-right">
        <p className="text-xs text-muted-foreground">Gross Yearly Total</p>
        <p className="font-display text-xl font-semibold tabular-nums">{formatCurrency(yearlyTotal)}</p>
      </div>
    </Card>
  );
}
