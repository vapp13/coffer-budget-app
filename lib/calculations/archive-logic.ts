import type { Expense } from "@/lib/validation/expense";
import { resolveExpenseType } from "@/lib/validation/expense";
import { monthKeyFromStoredDate, compareMonths, isSameMonth, type MonthKey } from "@/lib/date/month";

/**
 * Whether an active expense should be automatically archived, given the
 * real current month:
 * - A one-time expense archives once its own month has passed.
 * - A recurring expense with an end date archives once that end date's
 *   month has passed (it stays active, with a warning, during its final month).
 * Recurring expenses with no end date never auto-archive.
 */
export function shouldAutoArchive(expense: Expense, currentMonth: MonthKey): boolean {
  if (!expense.isActive) return false;

  if (resolveExpenseType(expense) === "one_time") {
    if (!expense.startDate) return false;
    return compareMonths(monthKeyFromStoredDate(expense.startDate), currentMonth) < 0;
  }

  if (expense.endDate) {
    return compareMonths(monthKeyFromStoredDate(expense.endDate), currentMonth) < 0;
  }

  return false;
}

/**
 * True during a recurring expense's final active month — i.e. its end date
 * falls in the current month, so it's still active now but will be
 * archived automatically once the month is over.
 */
export function isEndingThisMonth(expense: Expense, currentMonth: MonthKey): boolean {
  if (!expense.isActive) return false;
  if (resolveExpenseType(expense) !== "recurring") return false;
  if (!expense.endDate) return false;
  return isSameMonth(monthKeyFromStoredDate(expense.endDate), currentMonth);
}
