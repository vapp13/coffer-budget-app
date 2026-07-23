import { writeBatch, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { expensesRef, listExpenses } from "@/lib/data/expenses";
import { shouldAutoArchive } from "@/lib/calculations/archive-logic";
import { monthKeyFromDate } from "@/lib/date/month";

/**
 * Archives any expense that should no longer be active: a one-time expense
 * whose month has passed, or a recurring expense whose end date's month has
 * passed. Safe to call on every load — `shouldAutoArchive` only matches
 * still-active expenses, so an already-archived one is never touched again.
 *
 * Returns true if anything was archived (callers should invalidate cached
 * expense queries when it does).
 */
export async function archiveExpiredExpenses(userId: string): Promise<boolean> {
  const expenses = await listExpenses(userId);
  const currentMonth = monthKeyFromDate(new Date());

  const toArchive = expenses.filter((expense) => shouldAutoArchive(expense, currentMonth));
  if (toArchive.length === 0) return false;

  const batch = writeBatch(db);
  for (const expense of toArchive) {
    batch.update(doc(expensesRef(userId), expense.id), { isActive: false });
  }
  await batch.commit();
  return true;
}
