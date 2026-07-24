import { listCategories } from "@/lib/data/categories";
import { listExpenses } from "@/lib/data/expenses";
import { listIncomeSources } from "@/lib/data/income-sources";
import { listDeductions } from "@/lib/data/deductions";
import { listGoals } from "@/lib/data/goals";
import { listTaxProfiles } from "@/lib/data/tax-profiles";
import { getUserProfile } from "@/lib/data/user-profile";
import type { Category } from "@/lib/validation/category";
import type { Expense } from "@/lib/validation/expense";
import type { IncomeSource } from "@/lib/validation/income-source";
import type { Deduction } from "@/lib/validation/deduction";
import type { Goal } from "@/lib/validation/goal";
import type { TaxProfile } from "@/lib/validation/tax-profile";
import type { UserProfile } from "@/lib/validation/user-profile";

export type FullDataExport = {
  /** Bump this if the shape of this export ever changes incompatibly. */
  version: 1;
  exportedAt: string;
  userProfile: UserProfile | null;
  taxProfiles: TaxProfile[];
  categories: Category[];
  incomeSources: (IncomeSource & { deductions: Deduction[] })[];
  expenses: Expense[];
  goals: Goal[];
};

/**
 * A complete backup of everything the user has stored — every collection,
 * including each income source's deductions subcollection nested inline.
 * Intended purely as a downloadable, human-readable backup/portability
 * guarantee, not as an import format (though its shape closely mirrors the
 * actual Firestore documents, so a future "restore from backup" feature
 * could reuse it directly).
 */
export async function exportAllUserData(userId: string): Promise<FullDataExport> {
  const [userProfile, taxProfiles, categories, incomeSources, expenses, goals] = await Promise.all([
    getUserProfile(userId),
    listTaxProfiles(userId),
    listCategories(userId),
    listIncomeSources(userId),
    listExpenses(userId),
    listGoals(userId),
  ]);

  const incomeSourcesWithDeductions = await Promise.all(
    incomeSources.map(async (source) => ({
      ...source,
      deductions: await listDeductions(userId, source.id),
    }))
  );

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    userProfile,
    taxProfiles,
    categories,
    incomeSources: incomeSourcesWithDeductions,
    expenses,
    goals,
  };
}
