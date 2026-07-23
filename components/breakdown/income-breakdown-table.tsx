import { Card } from "@/components/ui/card";
import type { IncomeBreakdown } from "@/lib/calculations/income-tax";

type IncomeBreakdownTableProps = {
  income: IncomeBreakdown;
  formatCurrency: (value: number) => string;
};

const ROWS: { key: keyof IncomeBreakdown["gross"]; label: string }[] = [
  { key: "yearly", label: "Yearly" },
  { key: "monthly", label: "Monthly" },
  { key: "weekly", label: "Weekly" },
  { key: "daily", label: "Daily" },
  { key: "hourly", label: "Hourly" },
];

export function IncomeBreakdownTable({ income, formatCurrency }: IncomeBreakdownTableProps) {
  return (
    <Card className="flex flex-col gap-1 p-0">
      <h2 className="px-4 pt-4 text-sm font-medium">Income breakdown</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-2 font-medium"> </th>
              <th className="px-4 py-2 text-right font-medium">Gross</th>
              <th className="px-4 py-2 text-right font-medium">Net</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.key} className="border-b border-border last:border-0">
                <td className="px-4 py-2.5 text-muted-foreground">{row.label}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  {formatCurrency(income.gross[row.key])}
                </td>
                <td className="px-4 py-2.5 text-right font-medium tabular-nums text-primary">
                  {formatCurrency(income.net[row.key])}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
