import Papa from "papaparse";
import { parseCsvText, findMissingHeaders, getField, type CsvParseOutcome } from "@/lib/csv/csv-helpers";
import { frequencySchema, type Frequency, type Expense } from "@/lib/validation/expense";
import { normalizeToYearly } from "@/lib/calculations/frequency";

/**
 * Coffer's own expense CSV format — not tied to any particular source
 * spreadsheet. "Total Yearly" is exported for reference/verification but is
 * always recalculated, never imported as source data.
 */
export const EXPENSE_CSV_COLUMNS = ["Description", "Category", "Frequency", "Amount", "Total Yearly"];
export const EXPENSE_REQUIRED_HEADERS = ["Description", "Category", "Frequency", "Amount"];

export type ParsedExpenseRow = {
  description: string;
  categoryName: string;
  frequency: Frequency;
  amount: number;
};

const KNOWN_FREQUENCIES = frequencySchema.options as readonly string[];

export function buildExpensesCsv(
  expenses: Expense[],
  categoryNameById: Record<string, string>
): string {
  const rows = expenses.map((expense) => ({
    Description: expense.description,
    Category: categoryNameById[expense.categoryId] ?? "Uncategorized",
    Frequency: expense.frequency,
    Amount: expense.unitCost,
    "Total Yearly": normalizeToYearly(expense.unitCost, expense.frequency).toFixed(2),
  }));
  return Papa.unparse(rows, { columns: EXPENSE_CSV_COLUMNS });
}

export function parseExpensesCsv(csvText: string): CsvParseOutcome<ParsedExpenseRow> {
  const parsed = parseCsvText(csvText);
  const missingHeaders = findMissingHeaders(parsed.meta.fields, EXPENSE_REQUIRED_HEADERS);
  if (missingHeaders.length > 0) {
    return { missingHeaders, validRows: [], skipped: [] };
  }

  const validRows: ParsedExpenseRow[] = [];
  const skipped: { row: number; reason: string }[] = [];

  parsed.data.forEach((row, index) => {
    const rowNumber = index + 2; // +1 for the header row, +1 for 1-based counting

    const description = getField(row, "Description");
    if (!description) {
      skipped.push({ row: rowNumber, reason: "Missing description" });
      return;
    }

    const categoryName = getField(row, "Category");
    if (!categoryName) {
      skipped.push({ row: rowNumber, reason: "Missing category" });
      return;
    }

    const rawFrequency = getField(row, "Frequency").toLowerCase();
    if (!KNOWN_FREQUENCIES.includes(rawFrequency)) {
      skipped.push({
        row: rowNumber,
        reason: `Unrecognized frequency "${getField(row, "Frequency") || "(blank)"}"`,
      });
      return;
    }

    const rawAmount = getField(row, "Amount");
    const amount = parseFloat(rawAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      skipped.push({ row: rowNumber, reason: `Invalid amount "${rawAmount || "(blank)"}"` });
      return;
    }

    validRows.push({ description, categoryName, frequency: rawFrequency as Frequency, amount });
  });

  return { missingHeaders: [], validRows, skipped };
}
