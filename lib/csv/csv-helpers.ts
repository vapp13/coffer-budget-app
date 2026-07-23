import Papa from "papaparse";

export type CsvParseOutcome<T> = {
  /** Non-empty only when required headers are missing — no rows are processed in that case. */
  missingHeaders: string[];
  validRows: T[];
  skipped: { row: number; reason: string }[];
};

export function parseCsvText(csvText: string) {
  return Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });
}

/** Case-insensitive, trimmed lookup — so "amount", "Amount", " Amount " all match. */
export function getField(row: Record<string, string>, header: string): string {
  const key = Object.keys(row).find((k) => k.trim().toLowerCase() === header.toLowerCase());
  return key ? (row[key] ?? "").trim() : "";
}

export function findMissingHeaders(fields: string[] | undefined, required: string[]): string[] {
  const normalized = (fields ?? []).map((f) => f.trim().toLowerCase());
  return required.filter((r) => !normalized.includes(r.toLowerCase()));
}
