"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useCountUp } from "@/hooks/use-count-up";

type SummaryCardProps = {
  label: string;
  value: number;
  formatValue?: (value: number) => string;
  tone?: "neutral" | "positive" | "negative";
};

export function SummaryCard({
  label,
  value,
  formatValue = (v) => v.toFixed(0),
  tone = "neutral",
}: SummaryCardProps) {
  const animated = useCountUp(value);

  return (
    <Card className="flex flex-col gap-1 transition-shadow hover:shadow-md">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span
        className={cn(
          "font-display text-2xl font-semibold tabular-nums",
          tone === "positive" && "text-primary",
          tone === "negative" && "text-negative"
        )}
      >
        {formatValue(animated)}
      </span>
    </Card>
  );
}
