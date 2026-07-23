import type { IncomeSource } from "@/lib/validation/income-source";
import type { Deduction } from "@/lib/validation/deduction";
import type { TaxProfileInput } from "@/lib/validation/tax-profile";
import { calculateIncomeBreakdown, timeUnitSplit, type IncomeBreakdown } from "@/lib/calculations/income-tax";
import { round2 } from "@/lib/calculations/math-helpers";
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

export type IncomeSourceBreakdown = {
  incomeSourceId: string;
  label: string;
  grossYearly: number;
  netYearly: number;
  deductionsYearly: number;
  /** True if this source's net comes from the user's own entered deductions
   * rather than the automatic UK tax/NI/pension estimate. */
  usingManualDeductions: boolean;
};

/**
 * Net for one income source: uses the user's manually-entered deductions if
 * any exist, otherwise falls back to the automatic UK estimate — so nothing
 * breaks for sources that predate the Deductions feature, and the app still
 * works reasonably before a user bothers entering their own figures.
 */
export function calculateIncomeSourceBreakdown(
  source: IncomeSource,
  deductions: Deduction[],
  taxProfile: TaxProfileInput
): IncomeSourceBreakdown {
  if (deductions.length > 0) {
    const deductionsMonthly = round2(deductions.reduce((sum, d) => sum + d.amount, 0));
    const deductionsYearly = round2(deductionsMonthly * 12);
    return {
      incomeSourceId: source.id,
      label: source.label,
      grossYearly: source.grossYearlyAmount,
      netYearly: round2(source.grossYearlyAmount - deductionsYearly),
      deductionsYearly,
      usingManualDeductions: true,
    };
  }

  const estimate = calculateIncomeBreakdown(source.grossYearlyAmount, taxProfile);
  return {
    incomeSourceId: source.id,
    label: source.label,
    grossYearly: source.grossYearlyAmount,
    netYearly: estimate.net.yearly,
    deductionsYearly: estimate.deductions.totalYearly,
    usingManualDeductions: false,
  };
}

/**
 * Combines every active income source's own gross/net (each computed
 * independently — manual deductions where entered, the automatic estimate
 * otherwise) into one IncomeBreakdown, so the rest of the app doesn't need
 * to know or care how many sources there are or how each one's net was
 * derived.
 */
export function calculateCombinedIncomeForMonth(
  incomeSources: IncomeSource[],
  deductionsBySourceId: Record<string, Deduction[]>,
  taxProfile: TaxProfileInput,
  target: MonthKey
): { breakdown: IncomeBreakdown; sources: IncomeSourceBreakdown[] } {
  const active = incomeSourcesActiveInMonth(incomeSources, target);
  const sources = active.map((source) =>
    calculateIncomeSourceBreakdown(source, deductionsBySourceId[source.id] ?? [], taxProfile)
  );

  const totalGrossYearly = round2(sources.reduce((sum, s) => sum + s.grossYearly, 0));
  const totalNetYearly = round2(sources.reduce((sum, s) => sum + s.netYearly, 0));
  const totalDeductionsYearly = round2(sources.reduce((sum, s) => sum + s.deductionsYearly, 0));

  const breakdown: IncomeBreakdown = {
    gross: timeUnitSplit(totalGrossYearly),
    net: timeUnitSplit(totalNetYearly),
    deductions: {
      // Not meaningful as separate figures once sources can mix manual
      // deductions with the automatic estimate — the combined total is
      // still accurate and is what every consumer actually uses.
      monthlyTax: 0,
      monthlyNationalInsurance: 0,
      monthlyPension: 0,
      totalMonthly: round2(totalDeductionsYearly / 12),
      totalYearly: totalDeductionsYearly,
    },
  };

  return { breakdown, sources };
}
