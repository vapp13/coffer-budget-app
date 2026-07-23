import type { Expense } from "@/lib/validation/expense";
import { resolveExpenseType } from "@/lib/validation/expense";
import { monthKeyFromStoredDate, compareMonths, isSameMonth, monthsBetween, daysInMonth, type MonthKey } from "@/lib/date/month";

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

/**
 * The month a periodic (yearly/quarterly) expense is anchored to — i.e.
 * which month it actually recurs in. Prefers the explicit start date; falls
 * back to when the record was created if no start date was set, so a
 * yearly/quarterly expense still lands in a specific, stable month rather
 * than defaulting to "every month" (which would 12x-overcount it) or
 * "no month" (which would silently drop it from every calculation).
 */
function anchorMonthFor(expense: Expense): MonthKey | null {
  if (expense.startDate) return monthKeyFromStoredDate(expense.startDate);
  if (expense.createdAt) return monthKeyFromStoredDate(expense.createdAt);
  return null;
}

/**
 * Whether this expense has an occurrence in the given month at all.
 *
 * A one-time expense occurs in exactly one month — the month of its start
 * date — regardless of what its `frequency` field happens to hold (it's
 * ignored entirely for one-time expenses).
 *
 * A recurring expense follows its frequency:
 * - Monthly (or daily/weekly/fortnightly) recurs every month it's active in.
 * - Quarterly recurs every third month counting from its anchor.
 * - Yearly recurs only in its anchor's calendar month, once a year.
 */
export function expenseOccursInMonth(expense: Expense, target: MonthKey): boolean {
  if (!expense.isActive) return false;

  if (resolveExpenseType(expense) === "one_time") {
    // Schema requires a start date for one-time expenses; defensively treat
    // a missing one as "never occurs" rather than throwing.
    return expense.startDate ? isSameMonth(monthKeyFromStoredDate(expense.startDate), target) : false;
  }

  if (expense.endDate && compareMonths(target, monthKeyFromStoredDate(expense.endDate)) > 0) {
    return false;
  }
  if (expense.startDate && compareMonths(target, monthKeyFromStoredDate(expense.startDate)) < 0) {
    return false;
  }

  if (expense.frequency === "yearly" || expense.frequency === "quarterly") {
    const anchor = anchorMonthFor(expense);
    // No anchor at all (no start date, no createdAt) — can't pin a specific
    // recurrence month. Rather than hide the expense entirely, treat it as
    // active every month; expenseAmountForMonth smooths the amount evenly
    // in this case so the annual total still comes out right.
    if (!anchor) return true;
    if (expense.frequency === "yearly") return target.month === anchor.month;
    return mod(monthsBetween(anchor, target), 3) === 0;
  }

  return true;
}

/**
 * The actual amount this expense contributes in the given month — £0 if it
 * doesn't occur at all that month (e.g. a yearly bill in an off-month, or a
 * one-time expense in any month but its own). Daily/weekly/fortnightly
 * amounts use the target month's real day count rather than a flat 1/365 or
 * 1/52 share, so February and a 31-day month aren't treated identically.
 */
export function expenseAmountForMonth(expense: Expense, target: MonthKey): number {
  if (!expenseOccursInMonth(expense, target)) return 0;

  if (resolveExpenseType(expense) === "one_time") {
    return expense.unitCost;
  }

  const days = daysInMonth(target.year, target.month);

  switch (expense.frequency) {
    case "daily":
      return expense.unitCost * days;
    case "weekly":
      return expense.unitCost * (days / 7);
    case "fortnightly":
      return expense.unitCost * (days / 14);
    case "quarterly":
      return anchorMonthFor(expense) ? expense.unitCost : expense.unitCost / 3;
    case "yearly":
      return anchorMonthFor(expense) ? expense.unitCost : expense.unitCost / 12;
    case "monthly":
    default:
      return expense.unitCost;
  }
}
