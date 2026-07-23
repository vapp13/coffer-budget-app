import { describe, it, expect } from "vitest";
import {
  calculateIncomeSourceBreakdown,
  calculateCombinedIncomeForMonth,
} from "@/lib/calculations/income-sources";
import { DEFAULT_TAX_PROFILE } from "@/lib/validation/tax-profile";
import type { IncomeSource } from "@/lib/validation/income-source";
import type { Deduction } from "@/lib/validation/deduction";

const mainJob: IncomeSource = {
  id: "main",
  label: "Main Job",
  source: "main_job",
  grossYearlyAmount: 36000,
  effectiveFrom: new Date("2020-01-01"),
};

const freelance: IncomeSource = {
  id: "freelance",
  label: "Freelance",
  source: "freelance",
  grossYearlyAmount: 12000,
  effectiveFrom: new Date("2020-01-01"),
};

function deduction(overrides: Partial<Deduction>): Deduction {
  return { id: "d1", type: "other", amount: 100, ...overrides };
}

describe("calculateIncomeSourceBreakdown", () => {
  it("uses manual deductions when present, summing them monthly then annualizing", () => {
    const deductions = [
      deduction({ id: "d1", type: "paye", amount: 400 }),
      deduction({ id: "d2", type: "national_insurance", amount: 150 }),
    ];
    const result = calculateIncomeSourceBreakdown(mainJob, deductions, DEFAULT_TAX_PROFILE);

    expect(result.usingManualDeductions).toBe(true);
    expect(result.deductionsYearly).toBeCloseTo(550 * 12, 2);
    expect(result.netYearly).toBeCloseTo(36000 - 550 * 12, 2);
  });

  it("falls back to the automatic UK estimate when no deductions are entered", () => {
    const result = calculateIncomeSourceBreakdown(mainJob, [], DEFAULT_TAX_PROFILE);
    expect(result.usingManualDeductions).toBe(false);
    // Sanity check: net should be less than gross but still positive.
    expect(result.netYearly).toBeLessThan(result.grossYearly);
    expect(result.netYearly).toBeGreaterThan(0);
  });
});

describe("calculateCombinedIncomeForMonth", () => {
  it("sums gross and net independently across multiple sources with mixed deduction modes", () => {
    const deductionsBySourceId = {
      main: [deduction({ id: "d1", type: "paye", amount: 500 })],
      // freelance has no deductions entered — falls back to automatic estimate
    };

    const { breakdown, sources } = calculateCombinedIncomeForMonth(
      [mainJob, freelance],
      deductionsBySourceId,
      DEFAULT_TAX_PROFILE,
      { year: 2026, month: 5 }
    );

    expect(sources).toHaveLength(2);
    const mainResult = sources.find((s) => s.incomeSourceId === "main")!;
    const freelanceResult = sources.find((s) => s.incomeSourceId === "freelance")!;

    expect(mainResult.usingManualDeductions).toBe(true);
    expect(freelanceResult.usingManualDeductions).toBe(false);

    // Combined gross/net should just be the sum of each source's own figures.
    expect(breakdown.gross.yearly).toBeCloseTo(mainResult.grossYearly + freelanceResult.grossYearly, 2);
    expect(breakdown.net.yearly).toBeCloseTo(mainResult.netYearly + freelanceResult.netYearly, 2);
  });

  it("excludes income sources not active in the target month", () => {
    const endedSource: IncomeSource = {
      ...mainJob,
      id: "ended",
      effectiveFrom: new Date("2020-01-01"),
      effectiveTo: new Date("2025-12-31"),
    };
    const { sources } = calculateCombinedIncomeForMonth(
      [endedSource],
      {},
      DEFAULT_TAX_PROFILE,
      { year: 2026, month: 5 }
    );
    expect(sources).toHaveLength(0);
  });
});
