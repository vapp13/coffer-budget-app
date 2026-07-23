import { Card } from "@/components/ui/card";
import type { CategoryTotal } from "@/lib/calculations/expenses";

type CategoryLegendCardProps = {
  categories: CategoryTotal[];
  colorByCategoryId: Record<string, string>;
  formatCurrency: (value: number) => string;
};

export function CategoryLegendCard({
  categories,
  colorByCategoryId,
  formatCurrency,
}: CategoryLegendCardProps) {
  const spendingCategories = categories
    .filter((c) => c.monthly > 0)
    .sort((a, b) => b.monthly - a.monthly);

  const total = spendingCategories.reduce((sum, c) => sum + c.monthly, 0);

  if (spendingCategories.length === 0) return null;

  return (
    <Card className="flex flex-col gap-1 p-0">
      <h2 className="px-4 pt-4 text-sm font-medium">Categories</h2>
      <ul className="max-h-64 divide-y divide-border overflow-y-auto">
        {spendingCategories.map((category) => {
          const share = total > 0 ? (category.monthly / total) * 100 : 0;
          return (
            <li key={category.categoryId} className="flex items-center gap-3 px-4 py-2.5">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: colorByCategoryId[category.categoryId] ?? "#9AA3B2" }}
              />
              <span className="min-w-0 flex-1 truncate text-sm">{category.categoryName}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{share.toFixed(0)}%</span>
              <span className="shrink-0 text-sm font-medium tabular-nums">
                {formatCurrency(category.monthly)}
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
