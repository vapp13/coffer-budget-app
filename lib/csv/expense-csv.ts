import Papa from "papaparse";
import { parseCsvText, findMissingHeaders, getField, type CsvParseOutcome } from "@/lib/csv/csv-helpers";
import { toDateInputValue } from "@/lib/date-input-value";
import {
  frequencySchema,
  expenseTypeSchema,
  resolveExpenseType,
  type Frequency,
  type ExpenseType,
  type Expense,
} from "@/lib/validation/expense";
import { expenseYearlyTotal } from "@/lib/calculations/expenses";

/**
 * Coffer's own expense CSV format — not tied to any particular source
 * spreadsheet. "Total Yearly" is exported for reference/verification but is
 * always recalculated, never imported as source data. "Type" is optional on
 * import — missing or unrecognized values default to "Recurring", matching
 * every expense's behavior before this field existed. "Date" is only
 * meaningful for one-time rows (the month they count in) — recurring rows
 * ignore it, since start/end dates aren't part of this CSV format.
 */
export const EXPENSE_CSV_COLUMNS = ["Description", "Category", "Type", "Date", "Frequency", "Amount", "Total Yearly"];
export const EXPENSE_REQUIRED_HEADERS = ["Description", "Category", "Frequency", "Amount"];

export type ParsedExpenseRow = {
  description: string;
  categoryName: string;
  frequency: Frequency;
  expenseType: ExpenseType;
  date?: Date;
  amount: number;
};

const KNOWN_FREQUENCIES = frequencySchema.options as readonly string[];

function parseExpenseTypeCell(raw: string): ExpenseType {
  const normalized = raw.trim().toLowerCase().replace(/[\s-]/g, "_");
  const result = expenseTypeSchema.safeParse(normalized);
  return result.success ? result.data : "recurring";
}

export function buildExpensesCsv(
  expenses: Expense[],
  categoryNameById: Record<string, string>
): string {
  const rows = expenses.map((expense) => {
    const isOneTime = resolveExpenseType(expense) === "one_time";
    return {
      Description: expense.description,
      Category: categoryNameById[expense.categoryId] ?? "Uncategorized",
      Type: isOneTime ? "One-time" : "Recurring",
      Date: isOneTime && expense.startDate ? toDateInputValue(expense.startDate) : "",
      Frequency: expense.frequency,
      Amount: expense.unitCost,
      "Total Yearly": expenseYearlyTotal(expense).toFixed(2),
    };
  });
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

    const expenseType = parseExpenseTypeCell(getField(row, "Type"));

    let date: Date | undefined;
    const rawDate = getField(row, "Date");
    if (rawDate) {
      const parsedDate = new Date(rawDate);
      if (!Number.isNaN(parsedDate.getTime())) date = parsedDate;
    }

    if (expenseType === "one_time" && !date) {
      skipped.push({
        row: rowNumber,
        reason: `One-time expenses need a valid Date (expected yyyy-mm-dd), got "${rawDate || "(blank)"}"`,
      });
      return;
    }

    validRows.push({ description, categoryName, frequency: rawFrequency as Frequency, expenseType, date, amount });
  });

  return { missingHeaders: [], validRows, skipped };
}
