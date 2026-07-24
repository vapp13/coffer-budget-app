import { Card } from "@/components/ui/card";
import { calculateSavingsBreakdown } from "@/lib/calculations/savings";
import type { BudgetSummary } from "@/lib/calculations/budget-summary";

type SavingsBreakdownCardProps = {
  summary: BudgetSummary;
  formatCurrency: (value: number) => string;
};

export function SavingsBreakdownCard({ summary, formatCurrency }: SavingsBreakdownCardProps) {
  const savings = calculateSavingsBreakdown(summary);

  const rows: [string, string][] = [
    ["Savings category spend", formatCurrency(savings.savingsCategoryMonthly)],
    ["Unallocated remaining budget", formatCurrency(Math.max(0, savings.remainingMonthly))],
    ["Total savings", formatCurrency(savings.totalSavingsMonthly)],
  ];

  return (
    <Card className="flex flex-col gap-1 p-0">
      <div className="flex items-center justify-between px-4 pt-4">
        <h2 className="text-sm font-medium">Savings rate</h2>
        <span className="font-display text-lg font-semibold tabular-nums text-primary">
          {(savings.savingsRate * 100).toFixed(1)}%
        </span>
      </div>
      <p className="px-4 pb-1 text-xs text-muted-foreground">
        (Savings category spend + unallocated remaining budget) ÷ net income — the same figure
        shown on the dashboard's Savings Rate card and in Insights.
      </p>
      <div className="mt-2 border-t border-border">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between px-4 py-2.5 text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium tabular-nums">{value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
