import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { expenseSchema, type Expense, type ExpenseInput } from "@/lib/validation/expense";
import { toFirestoreDate, fromFirestoreDate } from "@/lib/data/firestore-dates";

export function expensesRef(userId: string) {
  return collection(db, "users", userId, "expenses");
}

function toFirestoreDoc(input: ExpenseInput) {
  return {
    ...input,
    startDate: toFirestoreDate(input.startDate),
    endDate: toFirestoreDate(input.endDate),
  };
}

export async function listExpenses(userId: string): Promise<Expense[]> {
  const snapshot = await getDocs(expensesRef(userId));
  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      startDate: fromFirestoreDate(data.startDate),
      endDate: fromFirestoreDate(data.endDate),
      createdAt: fromFirestoreDate(data.createdAt),
    } as Expense;
  });
}

export async function addExpense(
  userId: string,
  input: ExpenseInput
): Promise<string> {
  const parsed = expenseSchema.parse(input);
  const docRef = await addDoc(expensesRef(userId), {
    ...toFirestoreDoc(parsed),
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateExpense(
  userId: string,
  expenseId: string,
  input: ExpenseInput
): Promise<void> {
  const parsed = expenseSchema.parse(input);
  // createdAt is deliberately omitted — updateDoc only touches the fields
  // given here, so the original creation time is preserved.
  await updateDoc(doc(expensesRef(userId), expenseId), toFirestoreDoc(parsed));
}

export async function deleteExpense(
  userId: string,
  expenseId: string
): Promise<void> {
  await deleteDoc(doc(expensesRef(userId), expenseId));
}

/** Archive (false) or restore (true) an expense without touching its other fields. */
export async function setExpenseActive(
  userId: string,
  expenseId: string,
  isActive: boolean
): Promise<void> {
  await updateDoc(doc(expensesRef(userId), expenseId), { isActive });
}
