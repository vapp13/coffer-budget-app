"use client";

import { useState } from "react";
import { SlidersHorizontal, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SORT_OPTIONS, type SortOption } from "@/lib/sort";

export type GroupOption = "none" | "category";

const GROUP_OPTIONS: { value: GroupOption; label: string }[] = [
  { value: "none", label: "No grouping" },
  { value: "category", label: "Group by category" },
];

type ExpenseFilterSheetProps = {
  sort: SortOption;
  onSortChange: (value: SortOption) => void;
  group: GroupOption;
  onGroupChange: (value: GroupOption) => void;
};

export function ExpenseFilterSheet({ sort, onSortChange, group, onGroupChange }: ExpenseFilterSheetProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Button variant="outline" onClick={() => setIsOpen((open) => !open)} aria-expanded={isOpen} aria-label="Sort and group options">
        <SlidersHorizontal className="h-4 w-4" />
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-border bg-surface p-1 shadow-lg">
            <p className="px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Sort by
            </p>
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onSortChange(option.value)}
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-muted",
                  sort === option.value && "font-medium text-primary"
                )}
              >
                {option.label}
                {sort === option.value && <Check className="h-4 w-4" />}
              </button>
            ))}

            <div className="my-1 border-t border-border" />

            <p className="px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Group by
            </p>
            {GROUP_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onGroupChange(option.value)}
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-muted",
                  group === option.value && "font-medium text-primary"
                )}
              >
                {option.label}
                {group === option.value && <Check className="h-4 w-4" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
