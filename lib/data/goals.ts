import { collection, addDoc, updateDoc, deleteDoc, getDocs, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { goalSchema, type Goal, type GoalInput } from "@/lib/validation/goal";
import { toFirestoreDate, fromFirestoreDate } from "@/lib/data/firestore-dates";

function goalsRef(userId: string) {
  return collection(db, "users", userId, "goals");
}

function toFirestoreDoc(input: GoalInput) {
  return { ...input, targetDate: toFirestoreDate(input.targetDate) };
}

export async function listGoals(userId: string): Promise<Goal[]> {
  const snapshot = await getDocs(goalsRef(userId));
  return snapshot.docs.map((d) => {
    const data = d.data();
    return { id: d.id, ...data, targetDate: fromFirestoreDate(data.targetDate) } as Goal;
  });
}

export async function addGoal(userId: string, input: GoalInput): Promise<string> {
  const parsed = goalSchema.parse(input);
  const docRef = await addDoc(goalsRef(userId), toFirestoreDoc(parsed));
  return docRef.id;
}

export async function updateGoal(
  userId: string,
  goalId: string,
  input: GoalInput
): Promise<void> {
  const parsed = goalSchema.parse(input);
  await updateDoc(doc(goalsRef(userId), goalId), toFirestoreDoc(parsed));
}

export async function deleteGoal(userId: string, goalId: string): Promise<void> {
  await deleteDoc(doc(goalsRef(userId), goalId));
}
