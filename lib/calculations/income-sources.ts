import type { IncomeSource } from "@/lib/validation/income-source";
import { deductionDisplayLabel, type Deduction } from "@/lib/validation/deduction";
import type { TaxProfileInput } from "@/lib/validation/tax-profile";
import { calculateMonthlyIncomeTax, calculateMonthlyNationalInsurance, timeUnitSplit, type IncomeBreakdown } from "@/lib/calculations/income-tax";
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

export type DeductionLineItem = {
  label: string;
  /** Monthly amount for this specific line. */
  amount: number;
  source: "manual" | "automatic";
};

export type IncomeSourceBreakdown = {
  incomeSourceId: string;
  label: string;
  grossYearly: number;
  netYearly: number;
  deductionsYearly: number;
  /** Itemized monthly deduction lines: PAYE and National Insurance always
   * appear (manual if entered, automatic estimate otherwise), plus any
   * other manual deductions (pension, student loan, etc). There is no
   * automatic pension line — pension is only ever a manual entry. */
  deductionLines: DeductionLineItem[];
};

/**
 * Net for one income source, mixing manual and automatic deductions at the
 * individual PAYE/National Insurance level rather than all-or-nothing:
 * - If the user has manually entered a PAYE deduction, that value is used;
 *   otherwise PAYE is automatically estimated.
 * - Same independently for National Insurance.
 * - Any other manual deductions (pension, student loan, etc.) are simply
 *   added — there's no automatic equivalent to override for these.
 * This means adding a manual PAYE entry doesn't hide the automatic NI
 * estimate, and vice versa (see the deductions-mixing tests).
 */
export function calculateIncomeSourceBreakdown(
  source: IncomeSource,
  deductions: Deduction[],
  taxProfile: TaxProfileInput
): IncomeSourceBreakdown {
  const manualPaye = deductions.filter((d) => d.type === "paye");
  const manualNi = deductions.filter((d) => d.type === "national_insurance");
  const otherManual = deductions.filter((d) => d.type !== "paye" && d.type !== "national_insurance");

  const hasManualPaye = manualPaye.length > 0;
  const hasManualNi = manualNi.length > 0;

  const payeMonthly = hasManualPaye
    ? round2(manualPaye.reduce((sum, d) => sum + d.amount, 0))
    : calculateMonthlyIncomeTax(source.grossYearlyAmount, taxProfile);

  const niMonthly = hasManualNi
    ? round2(manualNi.reduce((sum, d) => sum + d.amount, 0))
    : calculateMonthlyNationalInsurance(source.grossYearlyAmount, taxProfile);

  const otherMonthly = round2(otherManual.reduce((sum, d) => sum + d.amount, 0));

  const deductionLines: DeductionLineItem[] = [
    { label: "PAYE", amount: payeMonthly, source: hasManualPaye ? "manual" : "automatic" },
    { label: "National Insurance", amount: niMonthly, source: hasManualNi ? "manual" : "automatic" },
    ...otherManual.map((d) => ({
      label: deductionDisplayLabel(d),
      amount: d.amount,
      source: "manual" as const,
    })),
  ];

  const deductionsMonthly = round2(payeMonthly + niMonthly + otherMonthly);
  const deductionsYearly = round2(deductionsMonthly * 12);

  return {
    incomeSourceId: source.id,
    label: source.label,
    grossYearly: source.grossYearlyAmount,
    netYearly: round2(source.grossYearlyAmount - deductionsYearly),
    deductionsYearly,
    deductionLines,
  };
}

/**
 * Combines every active income source's own gross/net (each computed
 * independently via calculateIncomeSourceBreakdown) into one IncomeBreakdown,
 * so the rest of the app doesn't need to know or care how many sources
 * there are or how each one's net was derived.
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
      totalMonthly: round2(totalDeductionsYearly / 12),
      totalYearly: totalDeductionsYearly,
    },
  };

  return { breakdown, sources };
}
