import { cn } from "@/lib/utils";
import type { ExpenseType } from "@/lib/validation/expense";

type ExpenseTypeBadgeProps = {
  type: ExpenseType;
  className?: string;
};

export function ExpenseTypeBadge({ type, className }: ExpenseTypeBadgeProps) {
  const isOneTime = type === "one_time";
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        isOneTime
          ? "bg-orange-500/15 text-orange-600 dark:text-orange-400"
          : "bg-blue-500/15 text-blue-600 dark:text-blue-400",
        className
      )}
    >
      {isOneTime ? "One-time" : "Recurring"}
    </span>
  );
}
