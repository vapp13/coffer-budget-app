import { Lightbulb, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Insight } from "@/lib/insights";

type InsightsCardProps = {
  insights: Insight[];
  formatCurrency: (value: number) => string;
};

function renderInsight(insight: Insight, formatCurrency: (value: number) => string): string {
  switch (insight.kind) {
    case "over-budget": {
      const [first, second, ...rest] = insight.categoryNames;
      if (insight.categoryNames.length === 1) {
        return `You're over budget in ${first} this month.`;
      }
      const names = rest.length > 0 ? `${first} and ${second}, and ${rest.length} more` : `${first} and ${second}`;
      return `You're over budget in ${names} this month.`;
    }
    case "ending-soon": {
      const [first, second, ...rest] = insight.expenseNames;
      if (insight.expenseNames.length === 1) {
        return `"${first}" will end at the end of this month and will be automatically archived.`;
      }
      const names = rest.length > 0 ? `${first} and ${second}, and ${rest.length} more` : `${first} and ${second}`;
      return `${names} will end at the end of this month and will be automatically archived.`;
    }
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
        {insights.map((insight, index) => {
          const isWarning = insight.kind === "over-budget" || insight.kind === "ending-soon";
          const tone = insight.kind === "over-budget" ? "text-negative" : "text-accent";
          return (
            <li
              key={index}
              className={isWarning ? `flex items-start gap-2 text-sm font-medium ${tone}` : "text-sm text-muted-foreground"}
            >
              {isWarning && <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}
              {renderInsight(insight, formatCurrency)}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
