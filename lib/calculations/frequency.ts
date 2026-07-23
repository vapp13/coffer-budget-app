import { FREQUENCY_TO_YEARLY_MULTIPLIER, type Frequency } from "@/lib/validation/expense";

/** Mirrors the spreadsheet's per-line SWITCH(frequency, ...) yearly-total formula. */
export function normalizeToYearly(unitCost: number, frequency: Frequency): number {
  return unitCost * FREQUENCY_TO_YEARLY_MULTIPLIER[frequency];
}
