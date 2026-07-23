import Papa from "papaparse";
import { parseCsvText, findMissingHeaders, getField, type CsvParseOutcome } from "@/lib/csv/csv-helpers";
import { toDateInputValue } from "@/lib/date-input-value";
import type { IncomeSource, IncomeSourceType } from "@/lib/validation/income-source";
import {
  INCOME_SOURCE_TYPE_LABELS,
  resolveIncomeSourceType,
  parseIncomeSourceType,
} from "@/lib/validation/income-source";

/**
 * Coffer's own income CSV format. "Gross Monthly" is exported for
 * reference/verification but is always recalculated, never imported as
 * source data. Dates use ISO 8601 (yyyy-mm-dd) — our own format on both
 * sides, so there's no ambiguity between dd/mm and mm/dd.
 */
export const INCOME_CSV_COLUMNS = [
  "Label",
  "Source",
  "Source Details",
  "Gross Yearly Amount",
  "Effective From",
  "Effective To",
  "Gross Monthly",
];
export const INCOME_REQUIRED_HEADERS = ["Label", "Gross Yearly Amount", "Effective From"];

export type ParsedIncomeRow = {
  label: string;
  source: IncomeSourceType;
  sourceDetails?: string;
  grossYearlyAmount: number;
  effectiveFrom: Date;
  effectiveTo?: Date;
};

export function buildIncomeCsv(incomeSources: IncomeSource[]): string {
  const rows = incomeSources.map((income) => ({
    Label: income.label,
    Source: INCOME_SOURCE_TYPE_LABELS[resolveIncomeSourceType(income)],
    "Source Details": income.sourceDetails ?? "",
    "Gross Yearly Amount": income.grossYearlyAmount,
    "Effective From": toDateInputValue(income.effectiveFrom),
    "Effective To": income.effectiveTo ? toDateInputValue(income.effectiveTo) : "",
    "Gross Monthly": (income.grossYearlyAmount / 12).toFixed(2),
  }));
  return Papa.unparse(rows, { columns: INCOME_CSV_COLUMNS });
}

export function parseIncomeCsv(csvText: string): CsvParseOutcome<ParsedIncomeRow> {
  const parsed = parseCsvText(csvText);
  const missingHeaders = findMissingHeaders(parsed.meta.fields, INCOME_REQUIRED_HEADERS);
  if (missingHeaders.length > 0) {
    return { missingHeaders, validRows: [], skipped: [] };
  }

  const validRows: ParsedIncomeRow[] = [];
  const skipped: { row: number; reason: string }[] = [];

  parsed.data.forEach((row, index) => {
    const rowNumber = index + 2;

    const label = getField(row, "Label");
    if (!label) {
      skipped.push({ row: rowNumber, reason: "Missing label" });
      return;
    }

    const rawAmount = getField(row, "Gross Yearly Amount");
    const grossYearlyAmount = parseFloat(rawAmount);
    if (!Number.isFinite(grossYearlyAmount) || grossYearlyAmount <= 0) {
      skipped.push({ row: rowNumber, reason: `Invalid amount "${rawAmount || "(blank)"}"` });
      return;
    }

    const rawFrom = getField(row, "Effective From");
    const effectiveFrom = rawFrom ? new Date(rawFrom) : null;
    if (!effectiveFrom || Number.isNaN(effectiveFrom.getTime())) {
      skipped.push({
        row: rowNumber,
        reason: `Invalid or missing effective-from date "${rawFrom || "(blank)"}" (expected yyyy-mm-dd)`,
      });
      return;
    }

    const rawTo = getField(row, "Effective To");
    let effectiveTo: Date | undefined;
    if (rawTo) {
      const parsedTo = new Date(rawTo);
      if (Number.isNaN(parsedTo.getTime())) {
        skipped.push({ row: rowNumber, reason: `Invalid effective-to date "${rawTo}" (expected yyyy-mm-dd)` });
        return;
      }
      effectiveTo = parsedTo;
    }

    // Optional columns — absent or unrecognized values just fall back
    // gracefully rather than failing the row.
    const source = parseIncomeSourceType(getField(row, "Source"));
    const sourceDetails = getField(row, "Source Details") || undefined;

    validRows.push({ label, source, sourceDetails, grossYearlyAmount, effectiveFrom, effectiveTo });
  });

  return { missingHeaders: [], validRows, skipped };
}
