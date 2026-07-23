import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type BudgetProgressProps = {
  spent: number;
  income: number;
  formatCurrency: (value: number) => string;
};

export function BudgetProgress({ spent, income, formatCurrency }: BudgetProgressProps) {
  const ratio = income > 0 ? spent / income : 0;
  const percentage = Math.min(Math.max(ratio, 0), 1) * 100;
  const isOver = ratio > 1;
  const isClose = ratio > 0.85 && !isOver;

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium">Monthly budget usage</h2>
        <span className="whitespace-nowrap text-sm tabular-nums text-muted-foreground">
          {formatCurrency(spent)} / {formatCurrency(income)}
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-700 ease-out",
            isOver ? "bg-negative" : isClose ? "bg-accent" : "bg-primary"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {isOver && (
        <p className="text-xs text-negative">
          {formatCurrency(spent - income)} over your net income this month.
        </p>
      )}
    </Card>
  );
}
