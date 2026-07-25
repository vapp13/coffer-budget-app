import Link from "next/link";
import { CreditCard } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { calculatePaidOffPercentage } from "@/lib/calculations/debt";
import type { Debt } from "@/lib/validation/debt";

type DebtsSummaryCardProps = {
  debts: Debt[];
  formatCurrency: (value: number) => string;
};

export function DebtsSummaryCard({ debts, formatCurrency }: DebtsSummaryCardProps) {
  if (debts.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-3 py-6 text-center">
        <CreditCard className="h-6 w-6 text-negative" />
        <div>
          <p className="text-sm font-medium">No debts added yet</p>
          <p className="text-xs text-muted-foreground">
            Track a loan or credit card balance and see a payoff projection.
          </p>
        </div>
        <Link href="/debts">
          <Button variant="outline">Add your first debt</Button>
        </Link>
      </Card>
    );
  }

  const totalBalance = debts.reduce((sum, d) => sum + d.currentBalance, 0);
  const displayDebts = [...debts].sort((a, b) => b.currentBalance - a.currentBalance).slice(0, 3);

  return (
    <Card className="flex flex-col gap-3 p-0">
      <div className="flex items-center justify-between px-4 pt-4">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-negative" />
          <h2 className="text-sm font-medium">Debts</h2>
        </div>
        <Link href="/debts" className="text-xs font-medium text-primary hover:underline">
          View all
        </Link>
      </div>

      <div className="flex items-center justify-between px-4">
        <span className="text-xs text-muted-foreground">Total balance</span>
        <span className="text-sm font-semibold tabular-nums text-negative">{formatCurrency(totalBalance)}</span>
      </div>

      <ul className="flex flex-col gap-3 px-4 pb-4">
        {displayDebts.map((debt) => {
          const paidOffPercentage = calculatePaidOffPercentage(debt.currentBalance, debt.originalAmount);
          return (
            <li key={debt.id} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{debt.name}</span>
                <span className="tabular-nums text-muted-foreground">{formatCurrency(debt.currentBalance)}</span>
              </div>
              {paidOffPercentage !== null && (
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-500"
                    style={{ width: `${paidOffPercentage * 100}%` }}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
