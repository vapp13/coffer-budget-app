import { describe, it, expect } from "vitest";
import { DEFAULT_TAX_PROFILE } from "@/lib/validation/tax-profile";
import {
  calculateMonthlyPension,
  calculateMonthlyNationalInsurance,
  calculateMonthlyIncomeTax,
  calculateIncomeBreakdown,
} from "@/lib/calculations/income-tax";

// Fixture: the real yearly salary from Budget_2026.xlsx ("Yearly Budget PP2").
const YEARLY_SALARY = 51932;

describe("income tax engine — matches Budget_2026.xlsx cached values", () => {
  it("calculates monthly pension contribution (spreadsheet D22 = 424.11)", () => {
    expect(calculateMonthlyPension(YEARLY_SALARY, DEFAULT_TAX_PROFILE)).toBeCloseTo(424.11, 2);
  });

  it("calculates monthly National Insurance (spreadsheet D21 = 262.41)", () => {
    expect(
      calculateMonthlyNationalInsurance(YEARLY_SALARY, DEFAULT_TAX_PROFILE)
    ).toBeCloseTo(262.41, 2);
  });

  it("calculates monthly PAYE income tax (spreadsheet D20 = 571.21)", () => {
    expect(calculateMonthlyIncomeTax(YEARLY_SALARY, DEFAULT_TAX_PROFILE)).toBeCloseTo(571.21, 2);
  });

  it("calculates the full income breakdown (spreadsheet rows 27–31)", () => {
    const breakdown = calculateIncomeBreakdown(YEARLY_SALARY, DEFAULT_TAX_PROFILE);

    // Gross (row 28)
    expect(breakdown.gross.yearly).toBeCloseTo(51932, 2);
    expect(breakdown.gross.monthly).toBeCloseTo(4327.666667, 4);

    // Deductions total (D24 = 1257.73)
    expect(breakdown.deductions.totalMonthly).toBeCloseTo(1257.73, 2);

    // Net (row 31)
    expect(breakdown.net.yearly).toBeCloseTo(36839.24, 2);
    expect(breakdown.net.monthly).toBeCloseTo(3069.936667, 3);
  });
});
