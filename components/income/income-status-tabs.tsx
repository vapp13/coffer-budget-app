"use client";

import { cn } from "@/lib/utils";

export type IncomeStatusFilter = "all" | "active" | "ended";

const TABS: { value: IncomeStatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "ended", label: "Ended" },
];

type IncomeStatusTabsProps = {
  value: IncomeStatusFilter;
  onChange: (value: IncomeStatusFilter) => void;
};

export function IncomeStatusTabs({ value, onChange }: IncomeStatusTabsProps) {
  const activeIndex = TABS.findIndex((tab) => tab.value === value);

  return (
    <div role="tablist" aria-label="Filter by income status" className="relative flex border-b border-border">
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
      <div
        className="absolute bottom-0 h-0.5 w-1/3 rounded-full bg-primary transition-transform duration-300 ease-out"
        style={{ transform: `translateX(${activeIndex * 100}%)` }}
      />
    </div>
  );
}
