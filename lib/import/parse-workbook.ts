import { frequencySchema, type Frequency } from "@/lib/validation/expense";

export type ParsedExpenseRow = {
  description: string;
  categoryName: string;
  frequency: Frequency;
  unitCost: number;
  /** True if the sheet's frequency text didn't match a known value and we defaulted to "monthly". */
  frequencyWasGuessed: boolean;
};

export type ParseResult = {
  expenses: ParsedExpenseRow[];
  yearlySalary: number | null;
};

const KNOWN_FREQUENCIES = frequencySchema.options as readonly string[];

function normalizeCell(value: unknown): string {
  return String(value ?? "").trim();
}

function findHeaderRow(rows: unknown[][]): {
  rowIndex: number;
  descCol: number;
  catCol: number;
  freqCol: number;
  costCol: number;
} | null {
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r] ?? [];
    const lower = row.map((cell) => normalizeCell(cell).toLowerCase());
    const descCol = lower.indexOf("description");
    const catCol = lower.indexOf("category");
    const freqCol = lower.indexOf("frequency");
    if (descCol === -1 || catCol === -1 || freqCol === -1) continue;

    const costCol = lower.findIndex((cell) => cell === "unit" || cell.includes("cost"));
    if (costCol === -1) continue;

    return { rowIndex: r, descCol, catCol, freqCol, costCol };
  }
  return null;
}

function parseExpensesFromSheet(rows: unknown[][]): ParsedExpenseRow[] {
  const header = findHeaderRow(rows);
  if (!header) return [];

  const results: ParsedExpenseRow[] = [];
  for (let r = header.rowIndex + 1; r < rows.length; r++) {
    const row = rows[r] ?? [];
    const description = normalizeCell(row[header.descCol]);
    if (!description) continue;

    const categoryName = normalizeCell(row[header.catCol]) || "Other";
    const rawFrequency = normalizeCell(row[header.freqCol]).toLowerCase();
    const rawCost = row[header.costCol];
    const unitCost = typeof rawCost === "number" ? rawCost : parseFloat(String(rawCost));

    if (!Number.isFinite(unitCost) || unitCost <= 0) continue;

    const frequencyWasGuessed = !KNOWN_FREQUENCIES.includes(rawFrequency);
    const frequency = (frequencyWasGuessed ? "monthly" : rawFrequency) as Frequency;

    results.push({ description, categoryName, frequency, unitCost, frequencyWasGuessed });
  }
  return results;
}

function findYearlySalary(rows: unknown[][]): number | null {
  for (const row of rows) {
    for (let c = 0; c < (row?.length ?? 0); c++) {
      if (normalizeCell(row[c]).toLowerCase() === "yearly salary") {
        const candidate = row[c + 1];
        const value = typeof candidate === "number" ? candidate : parseFloat(String(candidate));
        if (Number.isFinite(value) && value > 0) return value;
      }
    }
  }
  return null;
}

/**
 * Scans every sheet for an expense listing table (a header row containing
 * Description/Category/Frequency/Unit-or-Cost columns, in any order or
 * position) and a "Yearly Salary" label-value pair. Built to recognize the
 * layout of the original Budget_2026.xlsx, but tolerant of column order
 * since it matches by header text, not position.
 */
export function parseWorkbook(sheets: Record<string, unknown[][]>): ParseResult {
  const expenses: ParsedExpenseRow[] = [];
  let yearlySalary: number | null = null;

  for (const rows of Object.values(sheets)) {
    expenses.push(...parseExpensesFromSheet(rows));
    if (yearlySalary === null) {
      yearlySalary = findYearlySalary(rows);
    }
  }

  return { expenses, yearlySalary };
}
