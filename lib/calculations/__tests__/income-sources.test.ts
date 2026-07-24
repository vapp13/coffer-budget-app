import { describe, it, expect } from "vitest";
import {
  calculateIncomeSourceBreakdown,
  calculateCombinedIncomeForMonth,
} from "@/lib/calculations/income-sources";
import { calculateMonthlyIncomeTax, calculateMonthlyNationalInsurance } from "@/lib/calculations/income-tax";
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

const autoPaye = calculateMonthlyIncomeTax(mainJob.grossYearlyAmount, DEFAULT_TAX_PROFILE);
const autoNi = calculateMonthlyNationalInsurance(mainJob.grossYearlyAmount, DEFAULT_TAX_PROFILE);

describe("calculateIncomeSourceBreakdown — deduction mixing scenarios", () => {
  it("Scenario 1: no deductions entered — automatically estimates PAYE and NI", () => {
    const result = calculateIncomeSourceBreakdown(mainJob, [], DEFAULT_TAX_PROFILE);

    expect(result.deductionLines).toEqual([
      { label: "PAYE", amount: autoPaye, source: "automatic" },
      { label: "National Insurance", amount: autoNi, source: "automatic" },
    ]);
    expect(result.netYearly).toBeLessThan(result.grossYearly);
    expect(result.netYearly).toBeGreaterThan(0);
  });

  it("Scenario 2: manual PAYE entered — NI stays automatic (not hidden or duplicated)", () => {
    const deductions = [deduction({ id: "d1", type: "paye", amount: 500 })];
    const result = calculateIncomeSourceBreakdown(mainJob, deductions, DEFAULT_TAX_PROFILE);

    const paye = result.deductionLines.find((l) => l.label === "PAYE")!;
    const ni = result.deductionLines.find((l) => l.label === "National Insurance")!;

    expect(paye).toEqual({ label: "PAYE", amount: 500, source: "manual" });
    expect(ni).toEqual({ label: "National Insurance", amount: autoNi, source: "automatic" });
    expect(result.deductionLines).toHaveLength(2);
  });

  it("Scenario 3: manual National Insurance entered — PAYE stays automatic", () => {
    const deductions = [deduction({ id: "d1", type: "national_insurance", amount: 200 })];
    const result = calculateIncomeSourceBreakdown(mainJob, deductions, DEFAULT_TAX_PROFILE);

    const paye = result.deductionLines.find((l) => l.label === "PAYE")!;
    const ni = result.deductionLines.find((l) => l.label === "National Insurance")!;

    expect(paye).toEqual({ label: "PAYE", amount: autoPaye, source: "automatic" });
    expect(ni).toEqual({ label: "National Insurance", amount: 200, source: "manual" });
    expect(result.deductionLines).toHaveLength(2);
  });

  it("Scenario 4: both manual PAYE and NI entered — no duplicate automatic lines", () => {
    const deductions = [
      deduction({ id: "d1", type: "paye", amount: 400 }),
      deduction({ id: "d2", type: "national_insurance", amount: 150 }),
    ];
    const result = calculateIncomeSourceBreakdown(mainJob, deductions, DEFAULT_TAX_PROFILE);

    expect(result.deductionLines).toEqual([
      { label: "PAYE", amount: 400, source: "manual" },
      { label: "National Insurance", amount: 150, source: "manual" },
    ]);
    expect(result.deductionsYearly).toBeCloseTo(550 * 12, 2);
    expect(result.netYearly).toBeCloseTo(36000 - 550 * 12, 2);
  });

  it("other manual deductions (e.g. pension) are always additive, with no automatic pension fallback", () => {
    const deductions = [deduction({ id: "d1", type: "pension", amount: 200, customLabel: undefined })];
    const result = calculateIncomeSourceBreakdown(mainJob, deductions, DEFAULT_TAX_PROFILE);

    const pensionLine = result.deductionLines.find((l) => l.label === "Pension Contribution");
    expect(pensionLine).toEqual({ label: "Pension Contribution", amount: 200, source: "manual" });
    // PAYE and NI both remain automatic since neither was manually entered.
    expect(result.deductionLines.find((l) => l.label === "PAYE")?.source).toBe("automatic");
    expect(result.deductionLines.find((l) => l.label === "National Insurance")?.source).toBe("automatic");
    expect(result.deductionsYearly).toBeCloseTo((autoPaye + autoNi + 200) * 12, 2);
  });

  it("sums multiple manual entries of the same type rather than only using the last one", () => {
    const deductions = [
      deduction({ id: "d1", type: "paye", amount: 300 }),
      deduction({ id: "d2", type: "paye", amount: 50 }),
    ];
    const result = calculateIncomeSourceBreakdown(mainJob, deductions, DEFAULT_TAX_PROFILE);
    const paye = result.deductionLines.find((l) => l.label === "PAYE")!;
    expect(paye.amount).toBeCloseTo(350, 2);
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

    expect(mainResult.deductionLines.find((l) => l.label === "PAYE")?.source).toBe("manual");
    expect(freelanceResult.deductionLines.find((l) => l.label === "PAYE")?.source).toBe("automatic");

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
