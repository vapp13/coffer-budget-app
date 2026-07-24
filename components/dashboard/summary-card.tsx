"use client";

import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { cn } from "@/lib/utils";
import { useCountUp } from "@/hooks/use-count-up";

type SummaryCardProps = {
  label: string;
  value: number;
  formatValue?: (value: number) => string;
  tone?: "neutral" | "positive" | "negative";
  info?: ReactNode;
};

export function SummaryCard({
  label,
  value,
  formatValue = (v) => v.toFixed(0),
  tone = "neutral",
  info,
}: SummaryCardProps) {
  const animated = useCountUp(value);

  return (
    <Card className="flex flex-col gap-1 transition-shadow hover:shadow-md">
      <span className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
        {info && <InfoTooltip title={label}>{info}</InfoTooltip>}
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
