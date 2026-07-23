import { describe, it, expect } from "vitest";
import {
  addMonths,
  compareMonths,
  monthsBetween,
  daysInMonth,
  isSameMonth,
  monthLabel,
} from "@/lib/date/month";

describe("addMonths", () => {
  it("adds within the same year", () => {
    expect(addMonths({ year: 2026, month: 2 }, 1)).toEqual({ year: 2026, month: 3 });
  });

  it("rolls over into the next year", () => {
    expect(addMonths({ year: 2026, month: 11 }, 1)).toEqual({ year: 2027, month: 0 });
  });

  it("rolls back into the previous year", () => {
    expect(addMonths({ year: 2026, month: 0 }, -1)).toEqual({ year: 2025, month: 11 });
  });

  it("handles multi-year jumps", () => {
    expect(addMonths({ year: 2026, month: 5 }, 30)).toEqual({ year: 2028, month: 11 });
  });
});

describe("compareMonths / isSameMonth", () => {
  it("orders by year first, then month", () => {
    expect(compareMonths({ year: 2025, month: 11 }, { year: 2026, month: 0 })).toBeLessThan(0);
    expect(compareMonths({ year: 2026, month: 5 }, { year: 2026, month: 3 })).toBeGreaterThan(0);
  });

  it("treats equal year+month as the same month", () => {
    expect(isSameMonth({ year: 2026, month: 3 }, { year: 2026, month: 3 })).toBe(true);
  });
});

describe("monthsBetween", () => {
  it("counts forward across a year boundary", () => {
    expect(monthsBetween({ year: 2025, month: 10 }, { year: 2026, month: 1 })).toBe(3);
  });

  it("counts negative when b is before a", () => {
    expect(monthsBetween({ year: 2026, month: 5 }, { year: 2026, month: 2 })).toBe(-3);
  });
});

describe("daysInMonth", () => {
  it("knows February in a leap year", () => {
    expect(daysInMonth(2024, 1)).toBe(29);
  });

  it("knows February in a non-leap year", () => {
    expect(daysInMonth(2026, 1)).toBe(28);
  });

  it("knows a 31-day month", () => {
    expect(daysInMonth(2026, 0)).toBe(31);
  });
});

describe("monthLabel", () => {
  it("formats as a readable month + year", () => {
    expect(monthLabel({ year: 2026, month: 2 })).toBe("March 2026");
  });
});
