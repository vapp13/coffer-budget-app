import { describe, it, expect } from "vitest";
import { parseWorkbook } from "@/lib/import/parse-workbook";

// A trimmed-down array-of-arrays fixture mirroring the real spreadsheet's
// "Expense Listing" columns (F:J) and the "Yearly Salary" cell (A18/B18),
// as they'd come back from XLSX.utils.sheet_to_json(sheet, { header: 1 }).
const FIXTURE_ROWS: unknown[][] = [
  ["Expense Breakdown", "", "", "", "", "Expense Listing"],
  ["Category", "Yearly", "Monthly", "Percentage", "", "Description", "Category", "Frequency", "Unit", "Total (Yearly)"],
  ["Mortgage", 9235.8, 769.65, 0.25, "", "House Mortgage", "Mortgage", "Monthly", 769.65, 9235.8],
  ["Maintenance", 2505.6, 208.8, 0.07, "", "House Service Charge", "Maintenance", "Monthly", 208.8, 2505.6],
  ["", "", "", "", "", "Amazon Prime", "Subscriptions", "Yearly", 95, 95],
  ["", "", "", "", "", "Free Trial Thing", "Subscriptions", "Weird", 12, 144],
  ["", "", "", "", "", "Cancelled Sub", "Subscriptions", "Monthly", 0, 0],
  ["Income Breakdown"],
  ["Yearly Salary", 51932],
  ["Monthly Salary", 4327.67],
];

const FIXTURE_SHEETS = { "Yearly Budget PP2": FIXTURE_ROWS };

describe("parseWorkbook", () => {
  it("finds the expense listing table regardless of surrounding blocks", () => {
    const result = parseWorkbook(FIXTURE_SHEETS);
    expect(result.expenses).toHaveLength(4);
  });

  it("parses description, category, frequency, and cost correctly", () => {
    const result = parseWorkbook(FIXTURE_SHEETS);
    expect(result.expenses[0]).toMatchObject({
      description: "House Mortgage",
      categoryName: "Mortgage",
      frequency: "monthly",
      unitCost: 769.65,
      frequencyWasGuessed: false,
    });
  });

  it("preserves 'yearly' as a valid frequency", () => {
    const result = parseWorkbook(FIXTURE_SHEETS);
    const amazonPrime = result.expenses.find((e) => e.description === "Amazon Prime");
    expect(amazonPrime?.frequency).toBe("yearly");
    expect(amazonPrime?.frequencyWasGuessed).toBe(false);
  });

  it("defaults an unrecognized frequency to monthly and flags it as guessed", () => {
    const result = parseWorkbook(FIXTURE_SHEETS);
    const weird = result.expenses.find((e) => e.description === "Free Trial Thing");
    expect(weird?.frequency).toBe("monthly");
    expect(weird?.frequencyWasGuessed).toBe(true);
  });

  it("skips zero-cost rows", () => {
    const result = parseWorkbook(FIXTURE_SHEETS);
    expect(result.expenses.find((e) => e.description === "Cancelled Sub")).toBeUndefined();
  });

  it("finds the yearly salary regardless of position in the sheet", () => {
    const result = parseWorkbook(FIXTURE_SHEETS);
    expect(result.yearlySalary).toBe(51932);
  });

  it("returns an empty result for a sheet with no matching headers", () => {
    const result = parseWorkbook({ Unrelated: [["Just", "some", "random", "data"]] });
    expect(result.expenses).toHaveLength(0);
    expect(result.yearlySalary).toBeNull();
  });
});
