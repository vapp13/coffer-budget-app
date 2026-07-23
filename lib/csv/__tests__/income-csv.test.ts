import { describe, it, expect } from "vitest";
import { parseIncomeCsv } from "@/lib/csv/income-csv";

describe("parseIncomeCsv", () => {
  it("parses a valid row with no end date", () => {
    const csv = `Label,Gross Yearly Amount,Effective From,Effective To,Gross Monthly
Salary,51932,2026-01-01,,4327.67`;

    const result = parseIncomeCsv(csv);
    expect(result.missingHeaders).toHaveLength(0);
    expect(result.validRows).toHaveLength(1);
    expect(result.validRows[0]!.label).toBe("Salary");
    expect(result.validRows[0]!.grossYearlyAmount).toBe(51932);
    expect(result.validRows[0]!.effectiveTo).toBeUndefined();
  });

  it("parses a valid row with an end date", () => {
    const csv = `Label,Gross Yearly Amount,Effective From,Effective To
Old Job,40000,2020-01-01,2025-06-30`;

    const result = parseIncomeCsv(csv);
    expect(result.validRows[0]!.effectiveTo?.getUTCFullYear()).toBe(2025);
  });

  it("reports missing required headers", () => {
    const csv = `Label,Gross Yearly Amount
Salary,51932`;

    const result = parseIncomeCsv(csv);
    expect(result.missingHeaders).toEqual(expect.arrayContaining(["Effective From"]));
    expect(result.validRows).toHaveLength(0);
  });

  it("ignores the 'Gross Monthly' informational column on import", () => {
    const csv = `Label,Gross Yearly Amount,Effective From,Gross Monthly
Salary,51932,2026-01-01,999999`;

    const result = parseIncomeCsv(csv);
    expect(Object.keys(result.validRows[0]!)).toEqual([
      "label",
      "source",
      "sourceDetails",
      "grossYearlyAmount",
      "effectiveFrom",
      "effectiveTo",
    ]);
  });

  it("parses a recognized Source label and falls back to 'other' when absent or unrecognized", () => {
    const csv = `Label,Source,Gross Yearly Amount,Effective From
Salary,Main Job,51932,2026-01-01
Side gig,Something Weird,5000,2026-01-01
No source col,,3000,2026-01-01`;

    const result = parseIncomeCsv(csv);
    expect(result.validRows[0]!.source).toBe("main_job");
    expect(result.validRows[1]!.source).toBe("other");
    expect(result.validRows[2]!.source).toBe("other");
  });

  it("captures optional Source Details when present", () => {
    const csv = `Label,Source,Source Details,Gross Yearly Amount,Effective From
Rental,Rental Income,221 Baker Street,12000,2026-01-01`;

    const result = parseIncomeCsv(csv);
    expect(result.validRows[0]!.sourceDetails).toBe("221 Baker Street");
  });

  it("skips a row with an invalid effective-from date", () => {
    const csv = `Label,Gross Yearly Amount,Effective From
Salary,51932,not-a-date`;

    const result = parseIncomeCsv(csv);
    expect(result.validRows).toHaveLength(0);
    expect(result.skipped[0]!.reason).toMatch(/effective-from/i);
  });

  it("skips a row with an invalid amount", () => {
    const csv = `Label,Gross Yearly Amount,Effective From
Salary,-5,2026-01-01`;

    const result = parseIncomeCsv(csv);
    expect(result.validRows).toHaveLength(0);
    expect(result.skipped[0]!.reason).toMatch(/amount/i);
  });
});
