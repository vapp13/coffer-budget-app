import { collection, addDoc, updateDoc, deleteDoc, getDocs, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { debtSchema, type Debt, type DebtInput } from "@/lib/validation/debt";
import { toFirestoreDate, fromFirestoreDate } from "@/lib/data/firestore-dates";

function debtsRef(userId: string) {
  return collection(db, "users", userId, "debts");
}

function toFirestoreDoc(input: DebtInput) {
  return { ...input, startDate: toFirestoreDate(input.startDate) };
}

export async function listDebts(userId: string): Promise<Debt[]> {
  const snapshot = await getDocs(debtsRef(userId));
  return snapshot.docs.map((d) => {
    const data = d.data();
    return { id: d.id, ...data, startDate: fromFirestoreDate(data.startDate) } as Debt;
  });
}

export async function addDebt(userId: string, input: DebtInput): Promise<string> {
  const parsed = debtSchema.parse(input);
  const docRef = await addDoc(debtsRef(userId), toFirestoreDoc(parsed));
  return docRef.id;
}

export async function updateDebt(userId: string, debtId: string, input: DebtInput): Promise<void> {
  const parsed = debtSchema.parse(input);
  await updateDoc(doc(debtsRef(userId), debtId), toFirestoreDoc(parsed));
}

export async function deleteDebt(userId: string, debtId: string): Promise<void> {
  await deleteDoc(doc(debtsRef(userId), debtId));
}
