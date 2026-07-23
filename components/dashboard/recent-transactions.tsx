import Link from "next/link";
import { Receipt } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export type TransactionRow = {
  id: string;
  description: string;
  categoryName: string;
  amount: number;
};

type RecentTransactionsProps = {
  title: string;
  items: TransactionRow[];
  formatCurrency: (value: number) => string;
};

export function RecentTransactions({ title, items, formatCurrency }: RecentTransactionsProps) {
  return (
    <Card className="flex flex-col gap-3 p-0">
      <div className="flex items-center justify-between px-4 pt-4">
        <h2 className="text-sm font-medium">{title}</h2>
        <Link href="/expenses" className="text-xs font-medium text-primary hover:underline">
          View all
        </Link>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Nothing this month"
          description="No expenses occur in the selected month."
        />
      ) : (
        <ul className="divide-y divide-border pb-1">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between px-4 py-3">
              <div className="min-w-0 pr-3">
                <p className="truncate text-sm font-medium">{item.description}</p>
                <p className="truncate text-xs text-muted-foreground">{item.categoryName}</p>
              </div>
              <span className="shrink-0 text-sm font-medium tabular-nums">
                {formatCurrency(item.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
