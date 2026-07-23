import {
  collection,
  addDoc,
  getDocs,
  doc,
  runTransaction,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import {
  taxProfileSchema,
  DEFAULT_TAX_PROFILE,
  type TaxProfile,
  type TaxProfileInput,
} from "@/lib/validation/tax-profile";
import { toFirestoreDate, fromFirestoreDate } from "@/lib/data/firestore-dates";

function taxProfilesRef(userId: string) {
  return collection(db, "users", userId, "taxProfiles");
}

function toFirestoreDoc(input: TaxProfileInput) {
  return { ...input, effectiveFrom: toFirestoreDate(input.effectiveFrom) };
}

export async function listTaxProfiles(userId: string): Promise<TaxProfile[]> {
  const snapshot = await getDocs(taxProfilesRef(userId));
  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      effectiveFrom: fromFirestoreDate(data.effectiveFrom) as Date,
    } as TaxProfile;
  });
}

export async function addTaxProfile(
  userId: string,
  input: TaxProfileInput
): Promise<string> {
  const parsed = taxProfileSchema.parse(input);
  const docRef = await addDoc(taxProfilesRef(userId), toFirestoreDoc(parsed));
  return docRef.id;
}

/**
 * Seeds one default UK tax profile for a brand-new user, exactly once.
 * Same transaction-guarded pattern as `ensureDefaultCategories` — see that
 * function's comment for why a plain "check then write" isn't safe here.
 */
export async function ensureDefaultTaxProfile(userId: string): Promise<void> {
  const userDocRef = doc(db, "users", userId);

  await runTransaction(db, async (transaction) => {
    const userSnap = await transaction.get(userDocRef);
    if (userSnap.exists() && userSnap.data().taxProfileSeeded) return;

    const newDocRef = doc(taxProfilesRef(userId));
    transaction.set(
      newDocRef,
      toFirestoreDoc(taxProfileSchema.parse(DEFAULT_TAX_PROFILE))
    );
    transaction.set(userDocRef, { taxProfileSeeded: true }, { merge: true });
  });
}
