import { cn } from "@/lib/utils";

type IncomeStatusBadgeProps = {
  active: boolean;
  className?: string;
};

export function IncomeStatusBadge({ active, className }: IncomeStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        active
          ? "bg-primary/15 text-primary"
          : "bg-muted text-muted-foreground",
        className
      )}
    >
      {active ? "Active" : "Ended"}
    </span>
  );
}
