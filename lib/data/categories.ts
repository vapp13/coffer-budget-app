import {
  collection,
  addDoc,
  getDocs,
  doc,
  runTransaction,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import {
  categorySchema,
  DEFAULT_CATEGORIES,
  type Category,
  type CategoryInput,
} from "@/lib/validation/category";

export function categoriesRef(userId: string) {
  return collection(db, "users", userId, "categories");
}

export async function listCategories(userId: string): Promise<Category[]> {
  const snapshot = await getDocs(categoriesRef(userId));
  const categories = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as CategoryInput) }));
  return categories.sort((a, b) => a.name.localeCompare(b.name));
}

export async function addCategory(
  userId: string,
  input: CategoryInput
): Promise<string> {
  const parsed = categorySchema.parse(input);
  const docRef = await addDoc(categoriesRef(userId), parsed);
  return docRef.id;
}

/**
 * Seeds the default category set for a brand-new user, exactly once.
 *
 * This runs inside a transaction guarded by a `categoriesSeeded` flag on the
 * user's own doc. Several components call `useCategories()` at nearly the
 * same time on first load (the Expenses page and its form, for instance),
 * so a plain "check if empty, then write" is a race condition — two callers
 * can both see "empty" and both seed, producing duplicates. The transaction
 * re-reads the flag on every retry, so only the first writer's batch of
 * categories ever lands; every later caller sees the flag already set and
 * does nothing.
 */
export async function ensureDefaultCategories(userId: string): Promise<void> {
  const userDocRef = doc(db, "users", userId);

  await runTransaction(db, async (transaction) => {
    const userSnap = await transaction.get(userDocRef);
    if (userSnap.exists() && userSnap.data().categoriesSeeded) return;

    for (const category of DEFAULT_CATEGORIES) {
      const newDocRef = doc(categoriesRef(userId));
      transaction.set(newDocRef, categorySchema.parse(category));
    }
    transaction.set(userDocRef, { categoriesSeeded: true }, { merge: true });
  });
}
