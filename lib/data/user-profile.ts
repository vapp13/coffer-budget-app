import { doc, getDoc, setDoc, runTransaction } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import {
  userProfileSchema,
  type UserProfile,
  type UserProfileInput,
  type UserProfileFormInput,
} from "@/lib/validation/user-profile";

function userDocRef(userId: string) {
  return doc(db, "users", userId);
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const snap = await getDoc(userDocRef(userId));
  if (!snap.exists()) return null;
  return { id: userId, ...(snap.data() as UserProfileInput) };
}

/**
 * Saves only the editable fields (location, currency, locale, theme,
 * budget cycle day). Uses `merge: true` so `displayName`/`photoURL` — not
 * part of this input type — are left untouched.
 */
export async function updateUserProfile(
  userId: string,
  input: UserProfileFormInput
): Promise<void> {
  await setDoc(userDocRef(userId), input, { merge: true });
}

/**
 * Seeds the profile doc from the signed-in Google account, exactly once.
 * Same transaction-guarded pattern as `ensureDefaultCategories` — see that
 * function's comment for why a plain "check then write" isn't safe here.
 */
export async function ensureUserProfile(
  userId: string,
  google: { displayName: string | null; photoURL: string | null }
): Promise<void> {
  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(userDocRef(userId));
    if (snap.exists() && snap.data().profileSeeded) return;

    const defaults: UserProfileInput = userProfileSchema.parse({
      displayName: google.displayName ?? "",
      photoURL: google.photoURL ?? "",
    });

    transaction.set(
      userDocRef(userId),
      { ...defaults, profileSeeded: true },
      { merge: true }
    );
  });
}
