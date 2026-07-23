import type { TaxProfileInput } from "@/lib/validation/tax-profile";
import { median3, round2, WEEKS_PER_YEAR, WORKING_DAYS_PER_YEAR, WORKING_HOURS_PER_YEAR } from "@/lib/calculations/math-helpers";

/**
 * Monthly pension contribution, deducted from gross before tax is calculated.
 * Spreadsheet: D22 = ROUND((B18/12) * B54, 2)
 */
export function calculateMonthlyPension(
  yearlyGross: number,
  taxProfile: Pick<TaxProfileInput, "pensionRate">
): number {
  return round2((yearlyGross / 12) * taxProfile.pensionRate);
}

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
 * Taxable pay here is gross minus pension (matches the spreadsheet's
 * definition — it does not separately apply the personal allowance because
 * the PAYE band minimums already encode it).
 */
export function calculateMonthlyIncomeTax(
  yearlyGross: number,
  taxProfile: Pick<
    TaxProfileInput,
    | "pensionRate"
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
  const monthlyGross = yearlyGross / 12;
  const monthlyPension = round2(monthlyGross * taxProfile.pensionRate);
  const taxableMonthly = monthlyGross - monthlyPension;

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
    monthlyTax: number;
    monthlyNationalInsurance: number;
    monthlyPension: number;
    totalMonthly: number;
    totalYearly: number;
  };
};

function timeUnitSplit(yearlyAmount: number) {
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
 */
export function calculateIncomeBreakdown(
  yearlyGross: number,
  taxProfile: TaxProfileInput
): IncomeBreakdown {
  const monthlyTax = calculateMonthlyIncomeTax(yearlyGross, taxProfile);
  const monthlyNationalInsurance = calculateMonthlyNationalInsurance(yearlyGross, taxProfile);
  const monthlyPension = calculateMonthlyPension(yearlyGross, taxProfile);
  const totalMonthly = round2(monthlyTax + monthlyNationalInsurance + monthlyPension);
  const totalYearly = round2(totalMonthly * 12);
  const yearlyNet = yearlyGross - totalYearly;

  return {
    gross: timeUnitSplit(yearlyGross),
    net: timeUnitSplit(yearlyNet),
    deductions: {
      monthlyTax,
      monthlyNationalInsurance,
      monthlyPension,
      totalMonthly,
      totalYearly,
    },
  };
}
