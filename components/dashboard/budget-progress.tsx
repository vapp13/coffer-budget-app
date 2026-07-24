import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type BudgetProgressProps = {
  spent: number;
  income: number;
  formatCurrency: (value: number) => string;
};

export function BudgetProgress({ spent, income, formatCurrency }: BudgetProgressProps) {
  const ratio = income > 0 ? spent / income : 0;
  const barPercentage = Math.min(Math.max(ratio, 0), 1) * 100;
  const isOver = ratio > 1;
  const isClose = ratio > 0.85 && !isOver;

  const usedPercentage = income > 0 ? (spent / income) * 100 : 0;
  const remainingAmount = income - spent;
  const remainingPercentage = income > 0 ? (remainingAmount / income) * 100 : 0;

  return (
    <Card className="flex flex-col gap-3">
      <h2 className="text-sm font-medium">Monthly budget usage</h2>

      <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-700 ease-out",
            isOver ? "bg-negative" : isClose ? "bg-accent" : "bg-primary"
          )}
          style={{ width: `${barPercentage}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Used</span>
          <span className="text-sm font-semibold tabular-nums">
            {formatCurrency(spent)}{" "}
            <span className="font-normal text-muted-foreground">({usedPercentage.toFixed(0)}%)</span>
          </span>
        </div>
        <div className="flex flex-col gap-0.5 text-right">
          <span className="text-xs text-muted-foreground">{isOver ? "Over by" : "Remaining"}</span>
          <span className={cn("text-sm font-semibold tabular-nums", isOver && "text-negative")}>
            {formatCurrency(Math.abs(remainingAmount))}{" "}
            <span className="font-normal text-muted-foreground">
              ({Math.abs(remainingPercentage).toFixed(0)}%)
            </span>
          </span>
        </div>
      </div>
    </Card>
  );
}
