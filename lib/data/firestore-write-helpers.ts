import { deleteField } from "firebase/firestore";

/**
 * Strips any key whose value is `undefined` — for creating a brand-new
 * document. Firestore's addDoc/setDoc throw at runtime ("Unsupported field
 * value: undefined") if any key has value undefined, even though the key is
 * entirely legitimate to omit. This only matters when a form actually
 * submitted an empty value for an optional field (e.g. "" coerced to
 * undefined by a Zod preprocess) — a key that was simply never present in
 * the input to begin with never appears in Zod's parsed output at all, so
 * this is specifically for the "explicitly cleared" case.
 */
export function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  (Object.keys(obj) as (keyof T)[]).forEach((key) => {
    if (obj[key] !== undefined) result[key] = obj[key];
  });
  return result;
}

/**
 * Converts any key whose value is `undefined` into Firestore's
 * `deleteField()` sentinel — for updating an EXISTING document. Simply
 * omitting a key from an update payload leaves whatever was already stored
 * untouched, which is wrong when the user just cleared that field; this
 * makes the clear actually take effect.
 */
export function toUpdatePayload<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  (Object.keys(obj) as (keyof T)[]).forEach((key) => {
    result[key as string] = obj[key] === undefined ? deleteField() : obj[key];
  });
  return result;
}
