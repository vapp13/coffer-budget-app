"use client";

import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useFormatting } from "@/hooks/use-formatting";
import { Card } from "@/components/ui/card";

type IncomeVsExpensesChartProps = {
  netMonthlyIncome: number;
  monthlyExpenses: number;
};

export function IncomeVsExpensesChart({
  netMonthlyIncome,
  monthlyExpenses,
}: IncomeVsExpensesChartProps) {
  const { formatCurrency } = useFormatting();
  const data = [
    { name: "Net income", amount: Math.round(netMonthlyIncome * 100) / 100, fill: "hsl(var(--chart-1))" },
    { name: "Expenses", amount: Math.round(monthlyExpenses * 100) / 100, fill: "hsl(var(--negative))" },
  ];

  return (
    <Card>
      <h2 className="mb-3 text-sm font-medium">Income vs. expenses (monthly)</h2>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} width={70} tickFormatter={(v) => formatCurrency(v)} />
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
