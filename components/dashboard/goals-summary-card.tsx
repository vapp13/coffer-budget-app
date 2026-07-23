import Link from "next/link";
import { Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Goal } from "@/lib/validation/goal";

type GoalsSummaryCardProps = {
  goals: Goal[];
  formatCurrency: (value: number) => string;
};

export function GoalsSummaryCard({ goals, formatCurrency }: GoalsSummaryCardProps) {
  if (goals.length === 0) return null;

  const activeGoals = goals.filter((g) => g.currentAmount < g.targetAmount);
  const displayGoals = (activeGoals.length > 0 ? activeGoals : goals).slice(0, 3);

  return (
    <Card className="flex flex-col gap-3 p-0">
      <div className="flex items-center justify-between px-4 pt-4">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-medium">Goals</h2>
        </div>
        <Link href="/goals" className="text-xs font-medium text-primary hover:underline">
          View all
        </Link>
      </div>

      <ul className="flex flex-col gap-3 px-4 pb-4">
        {displayGoals.map((goal) => {
          const ratio = goal.targetAmount > 0 ? goal.currentAmount / goal.targetAmount : 0;
          const percentage = Math.min(Math.max(ratio, 0), 1) * 100;
          return (
            <li key={goal.id} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{goal.name}</span>
                <span className="tabular-nums text-muted-foreground">
                  {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-accent transition-[width] duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
