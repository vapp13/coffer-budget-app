import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import {
  incomeSourceSchema,
  type IncomeSource,
  type IncomeSourceInput,
} from "@/lib/validation/income-source";
import { toFirestoreDate, fromFirestoreDate } from "@/lib/data/firestore-dates";

function incomeSourcesRef(userId: string) {
  return collection(db, "users", userId, "incomeSources");
}

function toFirestoreDoc(input: IncomeSourceInput) {
  return {
    ...input,
    effectiveFrom: toFirestoreDate(input.effectiveFrom),
    effectiveTo: toFirestoreDate(input.effectiveTo),
  };
}

export async function listIncomeSources(userId: string): Promise<IncomeSource[]> {
  const snapshot = await getDocs(incomeSourcesRef(userId));
  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      effectiveFrom: fromFirestoreDate(data.effectiveFrom) as Date,
      effectiveTo: fromFirestoreDate(data.effectiveTo),
    } as IncomeSource;
  });
}

export async function addIncomeSource(
  userId: string,
  input: IncomeSourceInput
): Promise<string> {
  const parsed = incomeSourceSchema.parse(input);
  const docRef = await addDoc(incomeSourcesRef(userId), toFirestoreDoc(parsed));
  return docRef.id;
}

export async function updateIncomeSource(
  userId: string,
  incomeId: string,
  input: IncomeSourceInput
): Promise<void> {
  const parsed = incomeSourceSchema.parse(input);
  await updateDoc(doc(incomeSourcesRef(userId), incomeId), toFirestoreDoc(parsed));
}

export async function deleteIncomeSource(
  userId: string,
  incomeId: string
): Promise<void> {
  await deleteDoc(doc(incomeSourcesRef(userId), incomeId));
}
