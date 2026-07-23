"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UploadCloud, AlertTriangle, FileSpreadsheet } from "lucide-react";
import { useCategories } from "@/hooks/use-categories";
import { useExpenses } from "@/hooks/use-expenses";
import { useIncomeSources } from "@/hooks/use-income-sources";
import { useFormatting } from "@/hooks/use-formatting";
import { parseWorkbook, type ParseResult } from "@/lib/import/parse-workbook";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

// Cycled through for any category name the sheet uses that doesn't already
// exist in the user's account. Coordinates with the Coffer palette rather
// than being random.
const NEW_CATEGORY_COLORS = [
  "#2BAE85", "#4FA8C9", "#5B8DEF", "#D9B36C", "#E8896B",
  "#9B7FE8", "#E8748F", "#D98A4C", "#C9A227", "#8A9199",
];

export default function ImportPage() {
  const router = useRouter();
  const { data: categories, createCategory } = useCategories();
  const { createExpense } = useExpenses();
  const { createIncomeSource } = useIncomeSources();
  const { formatCurrency } = useFormatting();

  const [fileName, setFileName] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setParseResult(null);
    setFileName(file.name);

    try {
      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });

      const sheets: Record<string, unknown[][]> = {};
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) continue;
        sheets[sheetName] = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          raw: true,
        }) as unknown[][];
      }

      const result = parseWorkbook(sheets);
      setParseResult(result);

      if (result.expenses.length === 0 && result.yearlySalary === null) {
        toast.error("Couldn't find an expense listing or salary in that file.");
      }
    } catch {
      toast.error("Couldn't read that file — is it a valid .xlsx?");
      setFileName(null);
    } finally {
      setIsParsing(false);
    }
  }

  async function handleImport() {
    if (!parseResult) return;
    setIsImporting(true);

    try {
      // Resolve (or create) a category for every distinct name in the sheet.
      const categoryIdByName = new Map<string, string>();
      for (const category of categories ?? []) {
        categoryIdByName.set(category.name.trim().toLowerCase(), category.id);
      }

      const distinctNames = [...new Set(parseResult.expenses.map((e) => e.categoryName))];
      let colorIndex = 0;
      for (const name of distinctNames) {
        const key = name.trim().toLowerCase();
        if (categoryIdByName.has(key)) continue;
        const newId = await createCategory.mutateAsync({
          name,
          group: "Personal",
          color: NEW_CATEGORY_COLORS[colorIndex % NEW_CATEGORY_COLORS.length] ?? "#8A9199",
          isDefault: false,
        });
        colorIndex += 1;
        categoryIdByName.set(key, newId);
      }

      for (const row of parseResult.expenses) {
        const categoryId = categoryIdByName.get(row.categoryName.trim().toLowerCase());
        if (!categoryId) continue;
        await createExpense.mutateAsync({
          description: row.description,
          categoryId,
          unitCost: row.unitCost,
          frequency: row.frequency,
          isActive: true,
        });
      }

      if (parseResult.yearlySalary) {
        await createIncomeSource.mutateAsync({
          label: "Imported salary",
          grossYearlyAmount: parseResult.yearlySalary,
          effectiveFrom: new Date(),
        });
      }

      toast.success(
        `Imported ${parseResult.expenses.length} expense${parseResult.expenses.length === 1 ? "" : "s"}${
          parseResult.yearlySalary ? " and 1 income source" : ""
        }`
      );
      router.push("/dashboard");
    } catch {
      toast.error("Something went wrong partway through the import.");
    } finally {
      setIsImporting(false);
    }
  }

  const guessedCount = parseResult?.expenses.filter((e) => e.frequencyWasGuessed).length ?? 0;

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <h1 className="font-display text-xl font-semibold">Import from spreadsheet</h1>
        <p className="text-sm text-muted-foreground">
          Upload your existing budget spreadsheet to bring your expenses and
          income into Coffer in one go.
        </p>
      </div>

      {!fileName && (
        <Card>
          <label className="flex cursor-pointer flex-col items-center gap-3 py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <UploadCloud className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium">Choose a .xlsx file</p>
              <p className="text-xs text-muted-foreground">
                We look for a table with Description / Category / Frequency /
                Cost columns, and a "Yearly Salary" value.
              </p>
            </div>
            <input
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={handleFileChange}
            />
            <span className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              Browse files
            </span>
          </label>
        </Card>
      )}

      {isParsing && (
        <Card>
          <p className="text-sm text-muted-foreground">Reading {fileName}…</p>
        </Card>
      )}

      {!isParsing && parseResult && (
        <>
          <Card className="flex items-center gap-3">
            <FileSpreadsheet className="h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{fileName}</p>
              <p className="text-xs text-muted-foreground">
                Found {parseResult.expenses.length} expense
                {parseResult.expenses.length === 1 ? "" : "s"}
                {parseResult.yearlySalary
                  ? ` and a yearly salary of ${formatCurrency(parseResult.yearlySalary)}`
                  : ", no salary found"}
              </p>
            </div>
          </Card>

          {guessedCount > 0 && (
            <Card className="flex items-start gap-2 border-accent/40 bg-accent/10">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <p className="text-sm text-muted-foreground">
                {guessedCount} row{guessedCount === 1 ? "" : "s"} had a
                frequency we didn't recognize — defaulted to monthly. Review
                these after importing.
              </p>
            </Card>
          )}

          {parseResult.expenses.length === 0 ? (
            <EmptyState
              icon={FileSpreadsheet}
              title="No expenses found"
              description="Make sure the sheet has Description, Category, Frequency, and Cost/Unit columns."
            />
          ) : (
            <Card className="p-0">
              <ul className="max-h-80 divide-y divide-border overflow-y-auto">
                {parseResult.expenses.map((row, i) => (
                  <li key={i} className="flex items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{row.description}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {row.categoryName} · <span className="capitalize">{row.frequency}</span>
                        {row.frequencyWasGuessed && " (guessed)"}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-medium tabular-nums">
                      {formatCurrency(row.unitCost)}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setFileName(null);
                setParseResult(null);
              }}
            >
              Choose a different file
            </Button>
            <Button
              onClick={handleImport}
              disabled={isImporting || parseResult.expenses.length === 0}
            >
              {isImporting ? "Importing…" : "Import"}
            </Button>
          </div>
        </>
      )}
    </main>
  );
}
