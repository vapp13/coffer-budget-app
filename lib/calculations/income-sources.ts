import type { IncomeSource } from "@/lib/validation/income-source";
import { monthRange, type MonthKey } from "@/lib/date/month";

/**
 * Income sources active at any point during the given month — i.e. their
 * [effectiveFrom, effectiveTo] range overlaps the month, not just a single
 * instant. Supports multiple concurrent sources and past sources that have
 * since ended.
 */
export function incomeSourcesActiveInMonth(
  incomeSources: IncomeSource[],
  target: MonthKey
): IncomeSource[] {
  const { start, end } = monthRange(target);
  return incomeSources.filter((source) => {
    const startedByThen = source.effectiveFrom <= end;
    const notYetEndedByThen = !source.effectiveTo || source.effectiveTo >= start;
    return startedByThen && notYetEndedByThen;
  });
}

export function totalGrossYearlyIncomeForMonth(
  incomeSources: IncomeSource[],
  target: MonthKey
): number {
  return incomeSourcesActiveInMonth(incomeSources, target).reduce(
    (sum, source) => sum + source.grossYearlyAmount,
    0
  );
}
