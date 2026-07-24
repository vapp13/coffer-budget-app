import { describe, it, expect } from "vitest";
import { DEFAULT_TAX_PROFILE } from "@/lib/validation/tax-profile";
import {
  calculateMonthlyNationalInsurance,
  calculateMonthlyIncomeTax,
  calculateIncomeBreakdown,
} from "@/lib/calculations/income-tax";

// Fixture: the real yearly salary from Budget_2026.xlsx ("Yearly Budget PP2").
const YEARLY_SALARY = 51932;

// NOTE: as of the "remove automatic pension" change, PAYE and total
// deductions/net figures deliberately no longer match the original
// spreadsheet's cached values — the spreadsheet always assumed a pension
// contribution reduces taxable pay, and automatic deductions now cover only
// PAYE and National Insurance. National Insurance is unaffected by this
// change and still matches the spreadsheet exactly.
describe("income tax engine — PAYE/NI only, no automatic pension", () => {
  it("calculates monthly National Insurance (spreadsheet D21 = 262.41, unaffected by the pension change)", () => {
    expect(
      calculateMonthlyNationalInsurance(YEARLY_SALARY, DEFAULT_TAX_PROFILE)
    ).toBeCloseTo(262.41, 2);
  });

  it("calculates monthly PAYE on the full gross, without assuming a pension contribution", () => {
    // Recomputed by hand: taxable pay is the full monthly gross (4327.67),
    // not gross-minus-assumed-pension as the original spreadsheet did.
    expect(calculateMonthlyIncomeTax(YEARLY_SALARY, DEFAULT_TAX_PROFILE)).toBeCloseTo(683.73, 2);
  });

  it("calculates the full income breakdown with PAYE + NI only (no pension)", () => {
    const breakdown = calculateIncomeBreakdown(YEARLY_SALARY, DEFAULT_TAX_PROFILE);

    expect(breakdown.gross.yearly).toBeCloseTo(51932, 2);
    expect(breakdown.gross.monthly).toBeCloseTo(4327.666667, 4);

    // 683.73 (PAYE) + 262.41 (NI) — no pension line anymore.
    expect(breakdown.deductions.totalMonthly).toBeCloseTo(946.14, 2);

    expect(breakdown.net.yearly).toBeCloseTo(40578.32, 2);
    expect(breakdown.net.monthly).toBeCloseTo(3381.53, 2);
  });
});
