"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { CategoryTotal } from "@/lib/calculations/expenses";
import { useFormatting } from "@/hooks/use-formatting";
import { Card } from "@/components/ui/card";

export const REMAINING_BUDGET_SLICE_ID = "__remaining_budget__";
export const REMAINING_BUDGET_LABEL = "Remaining Budget";
export const REMAINING_BUDGET_COLOR = "hsl(var(--muted-foreground) / 0.35)";

type CategoryPieChartProps = {
  categories: CategoryTotal[];
  colorByCategoryId: Record<string, string>;
  /** Unspent budget for the month — shown as an extra neutral slice so the
   * chart reflects spending against the whole budget, not just categories. */
  remainingBudget?: number;
};

export function CategoryPieChart({ categories, colorByCategoryId, remainingBudget = 0 }: CategoryPieChartProps) {
  const { formatCurrency } = useFormatting();
  const data = categories
    .filter((c) => c.monthly > 0)
    .map((c) => ({ name: c.categoryName, value: c.monthly, id: c.categoryId }));

  if (remainingBudget > 0) {
    data.push({ name: REMAINING_BUDGET_LABEL, value: remainingBudget, id: REMAINING_BUDGET_SLICE_ID });
  }

  if (data.length === 0) {
    return (
      <Card>
        <h2 className="mb-3 text-sm font-medium">Spending by category</h2>
        <p className="text-sm text-muted-foreground">
          No expenses yet — add some to see the breakdown.
        </p>
      </Card>
    );
  }

  function colorFor(id: string) {
    if (id === REMAINING_BUDGET_SLICE_ID) return REMAINING_BUDGET_COLOR;
    return colorByCategoryId[id] ?? "#9AA3B2";
  }

  return (
    <Card>
      <h2 className="mb-3 text-sm font-medium">Spending by category</h2>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={55}
              outerRadius={95}
              paddingAngle={2}
              cornerRadius={4}
              stroke="hsl(var(--surface))"
              strokeWidth={2}
            >
              {data.map((entry) => (
                <Cell key={entry.id} fill={colorFor(entry.id)} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
