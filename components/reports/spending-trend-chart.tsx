"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";
import { Card } from "@/components/ui/card";
import type { MonthlyDataPoint } from "@/lib/calculations/monthly-series";

type SpendingTrendChartProps = {
  data: MonthlyDataPoint[];
  formatCurrency: (value: number) => string;
};

export function SpendingTrendChart({ data, formatCurrency }: SpendingTrendChartProps) {
  const chartData = data.map((point) => ({
    name: point.label,
    Income: Math.round(point.income * 100) / 100,
    Expenses: Math.round(point.expenses * 100) / 100,
  }));

  return (
    <Card>
      <h2 className="mb-3 text-sm font-medium">Income vs. expenses trend</h2>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={64}
              fontSize={12}
              tickFormatter={(value: number) => formatCurrency(value)}
            />
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Legend />
            <Line
              type="monotone"
              dataKey="Income"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="Expenses"
              stroke="hsl(var(--negative))"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
