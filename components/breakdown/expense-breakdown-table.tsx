import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import type { CategoryTotal } from "@/lib/calculations/expenses";

type ExpenseBreakdownTableProps = {
  categories: CategoryTotal[];
  totalMonthlyExpenses: number;
  remainingMonthly: number;
  remainingPercentage: number;
  formatCurrency: (value: number) => string;
};

export function ExpenseBreakdownTable({
  categories,
  totalMonthlyExpenses,
  remainingMonthly,
  remainingPercentage,
  formatCurrency,
}: ExpenseBreakdownTableProps) {
  const spendingCategories = [...categories].filter((c) => c.monthly > 0).sort((a, b) => b.monthly - a.monthly);
  const maxMonthly = spendingCategories[0]?.monthly ?? 0;
  const totalYearly = categories.reduce((sum, c) => sum + c.yearly, 0);

  if (spendingCategories.length === 0) {
    return (
      <Card>
        <h2 className="mb-2 text-sm font-medium">Expense breakdown</h2>
        <p className="text-sm text-muted-foreground">No expenses this month yet.</p>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-0 p-0">
      <h2 className="px-4 pt-4 text-sm font-medium">Expense breakdown</h2>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-2 font-medium">Category</th>
              <th className="px-4 py-2 text-right font-medium">Yearly</th>
              <th className="px-4 py-2 text-right font-medium">Monthly</th>
              <th className="px-4 py-2 text-right font-medium">% of expenses</th>
            </tr>
          </thead>
          <tbody>
            {spendingCategories.map((category) => {
              const shareOfExpenses =
                totalMonthlyExpenses > 0 ? (category.monthly / totalMonthlyExpenses) * 100 : 0;
              const intensity = maxMonthly > 0 ? category.monthly / maxMonthly : 0;
              return (
                <tr
                  key={category.categoryId}
                  className="border-b border-border last:border-0"
                  style={{ backgroundColor: `hsl(var(--primary) / ${(0.04 + intensity * 0.12).toFixed(3)})` }}
                >
                  <td className="px-4 py-2.5 font-medium">{category.categoryName}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{formatCurrency(category.yearly)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{formatCurrency(category.monthly)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                    {shareOfExpenses.toFixed(1)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border font-medium">
              <td className="px-4 py-2.5">Total</td>
              <td className="px-4 py-2.5 text-right tabular-nums">{formatCurrency(totalYearly)}</td>
              <td className="px-4 py-2.5 text-right tabular-nums">{formatCurrency(totalMonthlyExpenses)}</td>
              <td className="px-4 py-2.5 text-right tabular-nums">100%</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-border px-4 py-3">
        <span className="text-sm font-medium">Remaining disposable income</span>
        <div className="text-right">
          <p
            className={cn(
              "text-sm font-semibold tabular-nums",
              remainingMonthly >= 0 ? "text-primary" : "text-negative"
            )}
          >
            {formatCurrency(remainingMonthly)}
          </p>
          <p className="text-xs text-muted-foreground">
            {(remainingPercentage * 100).toFixed(1)}% of net income
          </p>
        </div>
      </div>
    </Card>
  );
}
