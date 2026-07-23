/** month is 0-11, matching JS Date's convention. */
export type MonthKey = { year: number; month: number };

export function monthKeyFromDate(date: Date): MonthKey {
  return { year: date.getFullYear(), month: date.getMonth() };
}

/** Extracts the calendar month from a Date the way we store dates — as a
 * UTC-midnight instant representing that calendar date (see toFirestoreDate/
 * date-helpers.ts) — so this must read UTC components, not local ones. */
export function monthKeyFromStoredDate(date: Date): MonthKey {
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() };
}

export function compareMonths(a: MonthKey, b: MonthKey): number {
  if (a.year !== b.year) return a.year - b.year;
  return a.month - b.month;
}

export function addMonths(key: MonthKey, delta: number): MonthKey {
  const total = key.year * 12 + key.month + delta;
  return { year: Math.floor(total / 12), month: ((total % 12) + 12) % 12 };
}

/** Signed count of months from `a` to `b` (positive if b is after a). */
export function monthsBetween(a: MonthKey, b: MonthKey): number {
  return (b.year - a.year) * 12 + (b.month - a.month);
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

/** The month's [start, end] instants, in the same UTC-midnight convention as stored dates. */
export function monthRange(key: MonthKey): { start: Date; end: Date } {
  const start = new Date(Date.UTC(key.year, key.month, 1));
  const end = new Date(Date.UTC(key.year, key.month + 1, 0, 23, 59, 59, 999));
  return { start, end };
}

export function monthLabel(key: MonthKey, locale = "en-GB"): string {
  return new Date(Date.UTC(key.year, key.month, 1)).toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Compact form for chart axes and lists, e.g. "Jan '26" — always includes
 * the year (abbreviated) since a range can cross a year boundary. */
export function monthShortLabel(key: MonthKey, locale = "en-GB"): string {
  const month = new Date(Date.UTC(key.year, key.month, 1)).toLocaleDateString(locale, {
    month: "short",
    timeZone: "UTC",
  });
  return `${month} '${String(key.year).slice(-2)}`;
}

export function isSameMonth(a: MonthKey, b: MonthKey): boolean {
  return compareMonths(a, b) === 0;
}
