import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Comparison } from "@/lib/calculations/comparison";

type ComparisonCardProps = {
  title: string;
  comparison: Comparison;
  formatCurrency: (value: number) => string;
};

export function ComparisonCard({ title, comparison, formatCurrency }: ComparisonCardProps) {
  const isIncrease = comparison.absoluteChange > 0.005;
  const isDecrease = comparison.absoluteChange < -0.005;

  // Framed around spending: spending more than before is the "watch out"
  // direction, spending less is the "good" direction.
  const tone = isIncrease ? "text-negative" : isDecrease ? "text-primary" : "text-muted-foreground";
  const Icon = isIncrease ? TrendingUp : isDecrease ? TrendingDown : Minus;

  return (
    <Card className="flex flex-col gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </span>
      <span className="font-display text-2xl font-semibold tabular-nums">
        {formatCurrency(comparison.current)}
      </span>
      <div className={cn("flex items-center gap-1 text-sm", tone)}>
        <Icon className="h-4 w-4 shrink-0" />
        {comparison.percentChange === null ? (
          <span>No prior spending to compare against</span>
        ) : (
          <span className="tabular-nums">
            {comparison.percentChange >= 0 ? "+" : ""}
            {comparison.percentChange.toFixed(1)}% ({formatCurrency(Math.abs(comparison.absoluteChange))})
          </span>
        )}
      </div>
    </Card>
  );
}
