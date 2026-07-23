import type { IncomeSource } from "@/lib/validation/income-source";

/**
 * Sums gross yearly income from every source active on the given date
 * (defaults to today). Supports multiple concurrent income sources, and
 * sources that have ended, without needing separate spreadsheet columns.
 */
export function totalActiveGrossYearlyIncome(
  incomeSources: IncomeSource[],
  asOf: Date = new Date()
): number {
  return incomeSources
    .filter((source) => {
      const startedByNow = source.effectiveFrom <= asOf;
      const notYetEnded = !source.effectiveTo || source.effectiveTo >= asOf;
      return startedByNow && notYetEnded;
    })
    .reduce((sum, source) => sum + source.grossYearlyAmount, 0);
}
