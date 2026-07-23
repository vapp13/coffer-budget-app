import { Timestamp } from "firebase/firestore";

/** Firestore stores dates as Timestamps; our schemas use plain JS Dates. */
export function toFirestoreDate(date: Date | undefined): Timestamp | null {
  return date ? Timestamp.fromDate(date) : null;
}

export function fromFirestoreDate(
  value: Timestamp | null | undefined
): Date | undefined {
  return value ? value.toDate() : undefined;
}
