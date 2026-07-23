"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSelectedMonth } from "@/lib/date/month-provider";
import { addMonths, monthLabel, isSameMonth, monthKeyFromDate } from "@/lib/date/month";
import { useFormatting } from "@/hooks/use-formatting";
import { Button } from "@/components/ui/button";

export function MonthPicker() {
  const { selectedMonth, setSelectedMonth, goToCurrentMonth } = useSelectedMonth();
  const { locale } = useFormatting();
  const isCurrentMonth = isSameMonth(selectedMonth, monthKeyFromDate(new Date()));

  return (
    <div className="flex items-center justify-between gap-2">
      <Button
        variant="outline"
        onClick={() => setSelectedMonth(addMonths(selectedMonth, -1))}
        aria-label="Previous month"
        className="px-2"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <button
        onClick={goToCurrentMonth}
        disabled={isCurrentMonth}
        className="font-display text-base font-semibold disabled:cursor-default"
      >
        {monthLabel(selectedMonth, locale)}
        {!isCurrentMonth && <span className="ml-2 text-xs font-normal text-primary hover:underline">Today</span>}
      </button>

      <Button
        variant="outline"
        onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
        aria-label="Next month"
        className="px-2"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
