import Link from "next/link";
import { Receipt } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { Expense } from "@/lib/validation/expense";
import type { Category } from "@/lib/validation/category";

type RecentTransactionsProps = {
  expenses: Expense[];
  categories: Category[];
  formatCurrency: (value: number) => string;
};

export function RecentTransactions({
  expenses,
  categories,
  formatCurrency,
}: RecentTransactionsProps) {
  const recent = [...expenses]
    .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0))
    .slice(0, 5);

  function categoryName(categoryId: string) {
    return categories.find((c) => c.id === categoryId)?.name ?? "Uncategorized";
  }

  return (
    <Card className="flex flex-col gap-3 p-0">
      <div className="flex items-center justify-between px-4 pt-4">
        <h2 className="text-sm font-medium">Recent expenses</h2>
        <Link href="/expenses" className="text-xs font-medium text-primary hover:underline">
          View all
        </Link>
      </div>

      {recent.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No expenses yet"
          description="Add your first expense to start tracking where your money goes."
        />
      ) : (
        <ul className="divide-y divide-border pb-1">
          {recent.map((expense) => (
            <li key={expense.id} className="flex items-center justify-between px-4 py-3">
              <div className="min-w-0 pr-3">
                <p className="truncate text-sm font-medium">{expense.description}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {categoryName(expense.categoryId)}
                </p>
              </div>
              <span className="shrink-0 text-sm font-medium tabular-nums">
                {formatCurrency(expense.unitCost)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
