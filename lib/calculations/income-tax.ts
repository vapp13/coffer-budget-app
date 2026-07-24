import type { TaxProfileInput } from "@/lib/validation/tax-profile";
import { median3, round2, WEEKS_PER_YEAR, WORKING_DAYS_PER_YEAR, WORKING_HOURS_PER_YEAR } from "@/lib/calculations/math-helpers";

/**
 * Monthly National Insurance.
 * Spreadsheet: D21 = ROUND(MAX(0, (B18/12) - (B52/12)) * B53, 2)
 */
export function calculateMonthlyNationalInsurance(
  yearlyGross: number,
  taxProfile: Pick<TaxProfileInput, "niThresholdAnnual" | "niRate">
): number {
  const monthlyGross = yearlyGross / 12;
  const monthlyThreshold = taxProfile.niThresholdAnnual / 12;
  return round2(Math.max(0, monthlyGross - monthlyThreshold) * taxProfile.niRate);
}

/**
 * Monthly PAYE income tax, prorating each annual band down to a monthly
 * cap and clamping the taxable pay into each band with MEDIAN(0, cap, amount).
 * Spreadsheet: D20 (the three-MEDIAN/MAX formula).
 *
 * Taxable pay is the full monthly gross — this deliberately does not assume
 * or subtract any pension contribution, since pension is no longer an
 * automatic deduction (not every user has one, and assuming one reduced
 * accuracy for those who don't). A user with a manually-entered pension
 * deduction has it reflected in their total deductions, just not fed back
 * into this tax calculation.
 */
export function calculateMonthlyIncomeTax(
  yearlyGross: number,
  taxProfile: Pick<
    TaxProfileInput,
    | "payeBasicRate"
    | "payeHigherRate"
    | "payeAdditionalRate"
    | "payeBasicMin"
    | "payeBasicMax"
    | "payeHigherMin"
    | "payeHigherMax"
    | "additionalRateOver"
  >
): number {
  const taxableMonthly = yearlyGross / 12;

  const basicBandWidth =
    (taxProfile.payeBasicMax - taxProfile.payeBasicMin + 1) / 12;
  const basicTaxable = median3(
    0,
    basicBandWidth,
    taxableMonthly - (taxProfile.payeBasicMin - 1) / 12
  );

  const higherBandWidth =
    (taxProfile.payeHigherMax - taxProfile.payeHigherMin + 1) / 12;
  const higherTaxable = median3(
    0,
    higherBandWidth,
    taxableMonthly - (taxProfile.payeHigherMin - 1) / 12
  );

  const additionalTaxable = Math.max(
    0,
    taxableMonthly - taxProfile.additionalRateOver / 12
  );

  return round2(
    basicTaxable * taxProfile.payeBasicRate +
      higherTaxable * taxProfile.payeHigherRate +
      additionalTaxable * taxProfile.payeAdditionalRate
  );
}

export type IncomeBreakdown = {
  gross: { yearly: number; monthly: number; weekly: number; daily: number; hourly: number };
  net: { yearly: number; monthly: number; weekly: number; daily: number; hourly: number };
  deductions: {
    totalMonthly: number;
    totalYearly: number;
  };
};

export function timeUnitSplit(yearlyAmount: number) {
  return {
    yearly: yearlyAmount,
    monthly: yearlyAmount / 12,
    weekly: yearlyAmount / WEEKS_PER_YEAR,
    daily: yearlyAmount / WORKING_DAYS_PER_YEAR,
    hourly: yearlyAmount / WORKING_HOURS_PER_YEAR,
  };
}

/**
 * Full income breakdown for one yearly gross salary: gross/net split across
 * yearly/monthly/weekly/daily/hourly, mirroring rows 27–31 of the spreadsheet.
 * Automatic deductions are PAYE and National Insurance only — no pension.
 */
export function calculateIncomeBreakdown(
  yearlyGross: number,
  taxProfile: TaxProfileInput
): IncomeBreakdown {
  const monthlyTax = calculateMonthlyIncomeTax(yearlyGross, taxProfile);
  const monthlyNationalInsurance = calculateMonthlyNationalInsurance(yearlyGross, taxProfile);
  const totalMonthly = round2(monthlyTax + monthlyNationalInsurance);
  const totalYearly = round2(totalMonthly * 12);
  const yearlyNet = yearlyGross - totalYearly;

  return {
    gross: timeUnitSplit(yearlyGross),
    net: timeUnitSplit(yearlyNet),
    deductions: {
      totalMonthly,
      totalYearly,
    },
  };
}
