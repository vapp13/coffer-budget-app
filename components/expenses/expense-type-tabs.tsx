"use client";

import { cn } from "@/lib/utils";

export type ExpenseTypeFilter = "all" | "recurring" | "one_time";

const TABS: { value: ExpenseTypeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "recurring", label: "Recurring" },
  { value: "one_time", label: "One-off" },
];

type ExpenseTypeTabsProps = {
  value: ExpenseTypeFilter;
  onChange: (value: ExpenseTypeFilter) => void;
};

export function ExpenseTypeTabs({ value, onChange }: ExpenseTypeTabsProps) {
  const activeIndex = TABS.findIndex((tab) => tab.value === value);

  return (
    <div role="tablist" aria-label="Filter by expense type" className="relative flex border-b border-border">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={value === tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            "flex-1 py-3 text-center text-sm font-medium transition-colors",
            value === tab.value ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {tab.label}
        </button>
      ))}
      {/* Animated underline — translates and matches each tab's 1/3 width, since all three tabs are equal width. */}
      <div
        className="absolute bottom-0 h-0.5 w-1/3 rounded-full bg-primary transition-transform duration-300 ease-out"
        style={{ transform: `translateX(${activeIndex * 100}%)` }}
      />
    </div>
  );
}
