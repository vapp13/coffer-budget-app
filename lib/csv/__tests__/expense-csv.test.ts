import { describe, it, expect } from "vitest";
import { parseExpensesCsv } from "@/lib/csv/expense-csv";

describe("parseExpensesCsv", () => {
  it("parses valid rows", () => {
    const csv = `Description,Category,Frequency,Amount,Total Yearly
House Mortgage,Mortgage,monthly,769.65,9235.80
Amazon Prime,Subscriptions,yearly,95,95.00`;

    const result = parseExpensesCsv(csv);
    expect(result.missingHeaders).toHaveLength(0);
    expect(result.validRows).toHaveLength(2);
    expect(result.validRows[0]!).toMatchObject({
      description: "House Mortgage",
      categoryName: "Mortgage",
      frequency: "monthly",
      amount: 769.65,
    });
  });

  it("reports missing required headers and processes no rows", () => {
    const csv = `Description,Category
House Mortgage,Mortgage`;

    const result = parseExpensesCsv(csv);
    expect(result.missingHeaders).toEqual(
      expect.arrayContaining(["Frequency", "Amount"])
    );
    expect(result.validRows).toHaveLength(0);
  });

  it("ignores unknown extra columns", () => {
    const csv = `Description,Category,Frequency,Amount,Notes,Random
House Mortgage,Mortgage,monthly,769.65,some note,whatever`;

    const result = parseExpensesCsv(csv);
    expect(result.missingHeaders).toHaveLength(0);
    expect(result.validRows).toHaveLength(1);
  });

  it("is case-insensitive and tolerant of header spacing", () => {
    const csv = ` description , CATEGORY ,frequency,amount
House Mortgage,Mortgage,monthly,769.65`;

    const result = parseExpensesCsv(csv);
    expect(result.missingHeaders).toHaveLength(0);
    expect(result.validRows).toHaveLength(1);
  });

  it("skips a row with an unrecognized frequency and reports why", () => {
    const csv = `Description,Category,Frequency,Amount
Something,Other,biannually,10`;

    const result = parseExpensesCsv(csv);
    expect(result.validRows).toHaveLength(0);
    expect(result.skipped).toHaveLength(1);
    expect(result.skipped[0]!.reason).toMatch(/frequency/i);
  });

  it("skips a row with an invalid or zero amount", () => {
    const csv = `Description,Category,Frequency,Amount
Something,Other,monthly,0
Something Else,Other,monthly,not-a-number`;

    const result = parseExpensesCsv(csv);
    expect(result.validRows).toHaveLength(0);
    expect(result.skipped).toHaveLength(2);
    expect(result.skipped.every((s) => /amount/i.test(s.reason))).toBe(true);
  });

  it("skips a row missing description or category", () => {
    const csv = `Description,Category,Frequency,Amount
,Other,monthly,10
Something,,monthly,10`;

    const result = parseExpensesCsv(csv);
    expect(result.validRows).toHaveLength(0);
    expect(result.skipped).toHaveLength(2);
  });

  it("ignores a 'Total Yearly' column on import (never treated as source data)", () => {
    const csv = `Description,Category,Frequency,Amount,Total Yearly
House Mortgage,Mortgage,monthly,769.65,999999`;

    const result = parseExpensesCsv(csv);
    // The parsed row shape has no yearly total field at all - only the
    // fields that get written back to Firestore.
    expect(result.validRows[0]!).not.toHaveProperty("Total Yearly");
    expect(Object.keys(result.validRows[0]!)).toEqual([
      "description",
      "categoryName",
      "frequency",
      "expenseType",
      "date",
      "amount",
    ]);
  });

  it("defaults Type to recurring when absent or unrecognized", () => {
    const csv = `Description,Category,Frequency,Amount
House Mortgage,Mortgage,monthly,769.65`;
    const result = parseExpensesCsv(csv);
    expect(result.validRows[0]!.expenseType).toBe("recurring");
  });

  it("parses a one-time row with a valid Date", () => {
    const csv = `Description,Category,Type,Date,Frequency,Amount
New laptop,Personal Spending,One-time,2026-03-15,monthly,899`;
    const result = parseExpensesCsv(csv);
    expect(result.validRows[0]!.expenseType).toBe("one_time");
    expect(result.validRows[0]!.date?.getUTCMonth()).toBe(2);
  });

  it("skips a one-time row with no valid Date", () => {
    const csv = `Description,Category,Type,Frequency,Amount
New laptop,Personal Spending,One-time,monthly,899`;
    const result = parseExpensesCsv(csv);
    expect(result.validRows).toHaveLength(0);
    expect(result.skipped[0]!.reason).toMatch(/one-time/i);
  });
});
