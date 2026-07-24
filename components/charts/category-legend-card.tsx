import { Card } from "@/components/ui/card";
import type { CategoryTotal } from "@/lib/calculations/expenses";
import {
  REMAINING_BUDGET_SLICE_ID,
  REMAINING_BUDGET_LABEL,
  REMAINING_BUDGET_COLOR,
} from "@/components/charts/category-pie-chart";

type CategoryLegendCardProps = {
  categories: CategoryTotal[];
  colorByCategoryId: Record<string, string>;
  formatCurrency: (value: number) => string;
  remainingBudget?: number;
};

export function CategoryLegendCard({
  categories,
  colorByCategoryId,
  formatCurrency,
  remainingBudget = 0,
}: CategoryLegendCardProps) {
  const spendingCategories = categories
    .filter((c) => c.monthly > 0)
    .sort((a, b) => b.monthly - a.monthly);

  type Row = { id: string; name: string; amount: number; color: string };

  const rows: Row[] = spendingCategories.map((c) => ({
    id: c.categoryId,
    name: c.categoryName,
    amount: c.monthly,
    color: colorByCategoryId[c.categoryId] ?? "#9AA3B2",
  }));

  if (remainingBudget > 0) {
    rows.push({
      id: REMAINING_BUDGET_SLICE_ID,
      name: REMAINING_BUDGET_LABEL,
      amount: remainingBudget,
      color: REMAINING_BUDGET_COLOR,
    });
  }

  const total = rows.reduce((sum, r) => sum + r.amount, 0);

  if (rows.length === 0) return null;

  return (
    <Card className="flex flex-col gap-1 p-0">
      <h2 className="px-4 pt-4 text-sm font-medium">Categories</h2>
      <ul className="max-h-64 divide-y divide-border overflow-y-auto">
        {rows.map((row) => {
          const share = total > 0 ? (row.amount / total) * 100 : 0;
          return (
            <li key={row.id} className="flex items-center gap-3 px-4 py-2.5">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: row.color }}
              />
              <span className="min-w-0 flex-1 truncate text-sm">{row.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{share.toFixed(0)}%</span>
              <span className="shrink-0 text-sm font-medium tabular-nums">
                {formatCurrency(row.amount)}
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
