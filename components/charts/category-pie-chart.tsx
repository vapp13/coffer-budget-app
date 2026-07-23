"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { CategoryTotal } from "@/lib/calculations/expenses";
import { useFormatting } from "@/hooks/use-formatting";
import { Card } from "@/components/ui/card";

type CategoryPieChartProps = {
  categories: CategoryTotal[];
  colorByCategoryId: Record<string, string>;
};

export function CategoryPieChart({ categories, colorByCategoryId }: CategoryPieChartProps) {
  const { formatCurrency } = useFormatting();
  const data = categories
    .filter((c) => c.monthly > 0)
    .map((c) => ({ name: c.categoryName, value: c.monthly, id: c.categoryId }));

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

  return (
    <Card>
      <h2 className="mb-3 text-sm font-medium">Spending by category (monthly)</h2>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90}>
              {data.map((entry) => (
                <Cell key={entry.id} fill={colorByCategoryId[entry.id] ?? "#9AA3B2"} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
