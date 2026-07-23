import { Lightbulb } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Insight } from "@/lib/insights";

type InsightsCardProps = {
  insights: Insight[];
  formatCurrency: (value: number) => string;
};

function renderInsight(insight: Insight, formatCurrency: (value: number) => string): string {
  switch (insight.kind) {
    case "largest-category":
      return `${insight.categoryName} is your biggest expense category, at ${insight.percentage.toFixed(0)}% of your net income.`;
    case "overspend":
      return `You're spending more than you earn this month — by ${formatCurrency(insight.amount)} at current rates.`;
    case "buffer":
      return `You have a healthy buffer — ${insight.percentage.toFixed(0)}% of your income is unallocated this month.`;
    case "savings-low":
      return "Your savings rate is under 10% — worth a look if you have room to increase it.";
    case "savings-good":
      return "Nice work — you're saving over 20% of your income.";
  }
}

export function InsightsCard({ insights, formatCurrency }: InsightsCardProps) {
  if (insights.length === 0) return null;

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-accent" />
        <h2 className="text-sm font-medium">Insights</h2>
      </div>
      <ul className="flex flex-col gap-2">
        {insights.map((insight, index) => (
          <li key={index} className="text-sm text-muted-foreground">
            {renderInsight(insight, formatCurrency)}
          </li>
        ))}
      </ul>
    </Card>
  );
}
