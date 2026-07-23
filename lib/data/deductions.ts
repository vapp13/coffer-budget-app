import { collection, addDoc, updateDoc, deleteDoc, getDocs, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { deductionSchema, type Deduction, type DeductionInput } from "@/lib/validation/deduction";

function deductionsRef(userId: string, incomeSourceId: string) {
  return collection(db, "users", userId, "incomeSources", incomeSourceId, "deductions");
}

export async function listDeductions(
  userId: string,
  incomeSourceId: string
): Promise<Deduction[]> {
  const snapshot = await getDocs(deductionsRef(userId, incomeSourceId));
  return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as DeductionInput) }));
}

export async function addDeduction(
  userId: string,
  incomeSourceId: string,
  input: DeductionInput
): Promise<string> {
  const parsed = deductionSchema.parse(input);
  const docRef = await addDoc(deductionsRef(userId, incomeSourceId), parsed);
  return docRef.id;
}

export async function updateDeduction(
  userId: string,
  incomeSourceId: string,
  deductionId: string,
  input: DeductionInput
): Promise<void> {
  const parsed = deductionSchema.parse(input);
  await updateDoc(doc(deductionsRef(userId, incomeSourceId), deductionId), parsed);
}

export async function deleteDeduction(
  userId: string,
  incomeSourceId: string,
  deductionId: string
): Promise<void> {
  await deleteDoc(doc(deductionsRef(userId, incomeSourceId), deductionId));
}
