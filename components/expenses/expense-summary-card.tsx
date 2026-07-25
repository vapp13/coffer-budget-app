import { Card } from "@/components/ui/card";
import { totalYearlyExpenseRate } from "@/lib/calculations/expenses";
import { round2 } from "@/lib/calculations/math-helpers";
import type { Expense } from "@/lib/validation/expense";

type ExpenseSummaryCardProps = {
  expenses: Expense[];
  formatCurrency: (value: number) => string;
};

export function ExpenseSummaryCard({ expenses, formatCurrency }: ExpenseSummaryCardProps) {
  const yearlyTotal = totalYearlyExpenseRate(expenses);
  const monthlyTotal = round2(yearlyTotal / 12);

  return (
    <Card className="flex items-center justify-between rounded-2xl">
      <div>
        <p className="text-xs text-muted-foreground">Monthly Total</p>
        <p className="font-display text-xl font-semibold tabular-nums">{formatCurrency(monthlyTotal)}</p>
      </div>
      <div className="text-right">
        <p className="text-xs text-muted-foreground">Yearly Total</p>
        <p className="font-display text-xl font-semibold tabular-nums">{formatCurrency(yearlyTotal)}</p>
      </div>
    </Card>
  );
}
