import { getDocs, query, where, doc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { categoriesRef } from "@/lib/data/categories";
import { expensesRef } from "@/lib/data/expenses";
import type { Category } from "@/lib/validation/category";

/**
 * Merges categories that share the same name (case-insensitive) — leftovers
 * from a seeding race condition that existed before `ensureDefaultCategories`
 * was made transactional. For each duplicate set, keeps the first doc as
 * canonical, re-points any expenses referencing a duplicate to that
 * canonical id (so no expense silently loses its category), then deletes
 * the duplicate category docs.
 *
 * Safe to call on every load — it's a no-op once there are no duplicates
 * left, so this can just run as part of `useCategories` indefinitely.
 *
 * Returns true if it changed anything (callers should invalidate cached
 * categories/expenses queries when it does).
 */
export async function dedupeCategories(userId: string): Promise<boolean> {
  const snapshot = await getDocs(categoriesRef(userId));
  const categories: Category[] = snapshot.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Category, "id">),
  }));

  const groupsByName = new Map<string, Category[]>();
  for (const category of categories) {
    const key = category.name.trim().toLowerCase();
    const group = groupsByName.get(key) ?? [];
    group.push(category);
    groupsByName.set(key, group);
  }

  const duplicateGroups = [...groupsByName.values()].filter((g) => g.length > 1);
  if (duplicateGroups.length === 0) return false;

  const batch = writeBatch(db);

  for (const group of duplicateGroups) {
    const [keeper, ...duplicates] = group as [Category, ...Category[]];

    for (const duplicate of duplicates) {
      const expenseSnapshot = await getDocs(
        query(expensesRef(userId), where("categoryId", "==", duplicate.id))
      );
      for (const expenseDoc of expenseSnapshot.docs) {
        batch.update(expenseDoc.ref, { categoryId: keeper.id });
      }
      batch.delete(doc(categoriesRef(userId), duplicate.id));
    }
  }

  await batch.commit();
  return true;
}
