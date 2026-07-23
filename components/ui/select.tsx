import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "w-full min-h-[44px] rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/40",
      className
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";
