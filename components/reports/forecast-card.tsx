import { Card } from "@/components/ui/card";
import type { MonthlyDataPoint } from "@/lib/calculations/monthly-series";

type ForecastCardProps = {
  data: MonthlyDataPoint[];
  formatCurrency: (value: number) => string;
};

export function ForecastCard({ data, formatCurrency }: ForecastCardProps) {
  return (
    <Card className="flex flex-col gap-3">
      <div>
        <h2 className="text-sm font-medium">Forecast</h2>
        <p className="text-xs text-muted-foreground">
          Based on your current recurring income and expenses — this isn't a
          prediction, just what's already scheduled to happen if nothing changes.
        </p>
      </div>
      <ul className="divide-y divide-border">
        {data.map((point) => (
          <li
            key={`${point.month.year}-${point.month.month}`}
            className="flex items-center justify-between py-2.5 text-sm"
          >
            <span className="font-medium">{point.label}</span>
            <div className="flex items-center gap-4 text-right tabular-nums text-muted-foreground">
              <span>{formatCurrency(point.expenses)} spend</span>
              <span
                className={point.remaining >= 0 ? "font-medium text-primary" : "font-medium text-negative"}
              >
                {formatCurrency(point.remaining)} left
              </span>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
