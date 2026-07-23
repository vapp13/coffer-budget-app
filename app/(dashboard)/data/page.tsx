"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download, Receipt, Wallet } from "lucide-react";
import { useCategories } from "@/hooks/use-categories";
import { useExpenses } from "@/hooks/use-expenses";
import { useIncomeSources } from "@/hooks/use-income-sources";
import { useFormatting } from "@/hooks/use-formatting";
import {
  buildExpensesCsv,
  parseExpensesCsv,
  type ParsedExpenseRow,
} from "@/lib/csv/expense-csv";
import {
  buildIncomeCsv,
  parseIncomeCsv,
  type ParsedIncomeRow,
} from "@/lib/csv/income-csv";
import { downloadTextFile } from "@/lib/csv/download-text-file";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CsvFileInput } from "@/components/data/csv-file-input";
import { ImportPreview } from "@/components/data/import-preview";

const NEW_CATEGORY_COLORS = [
  "#2BAE85", "#4FA8C9", "#5B8DEF", "#D9B36C", "#E8896B",
  "#9B7FE8", "#E8748F", "#D98A4C", "#C9A227", "#8A9199",
];

export default function DataPage() {
  const { data: categories, createCategory } = useCategories();
  const { data: expenses, createExpense } = useExpenses();
  const { data: incomeSources, createIncomeSource } = useIncomeSources();
  const { formatCurrency } = useFormatting();

  const [expensePreview, setExpensePreview] = useState<ReturnType<
    typeof parseExpensesCsv
  > | null>(null);
  const [isImportingExpenses, setIsImportingExpenses] = useState(false);

  const [incomePreview, setIncomePreview] = useState<ReturnType<
    typeof parseIncomeCsv
  > | null>(null);
  const [isImportingIncome, setIsImportingIncome] = useState(false);

  // ---- Expenses ----

  function handleExportExpenses() {
    const categoryNameById = Object.fromEntries((categories ?? []).map((c) => [c.id, c.name]));
    const csv = buildExpensesCsv(expenses ?? [], categoryNameById);
    downloadTextFile("coffer-expenses.csv", csv);
  }

  async function handleExpenseFileSelected(file: File) {
    const text = await file.text();
    const outcome = parseExpensesCsv(text);
    if (outcome.missingHeaders.length > 0) {
      toast.error(`Missing required column${outcome.missingHeaders.length === 1 ? "" : "s"}: ${outcome.missingHeaders.join(", ")}`);
      return;
    }
    setExpensePreview(outcome);
  }

  async function handleConfirmExpenseImport() {
    if (!expensePreview) return;
    setIsImportingExpenses(true);
    try {
      const categoryIdByName = new Map<string, string>();
      for (const category of categories ?? []) {
        categoryIdByName.set(category.name.trim().toLowerCase(), category.id);
      }

      const distinctNames = [...new Set(expensePreview.validRows.map((r) => r.categoryName))];
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

      for (const row of expensePreview.validRows) {
        const categoryId = categoryIdByName.get(row.categoryName.trim().toLowerCase());
        if (!categoryId) continue;
        await createExpense.mutateAsync({
          description: row.description,
          categoryId,
          unitCost: row.amount,
          frequency: row.frequency,
          isActive: true,
        });
      }

      toast.success(`Imported ${expensePreview.validRows.length} expenses`);
      setExpensePreview(null);
    } catch {
      toast.error("Something went wrong partway through the import.");
    } finally {
      setIsImportingExpenses(false);
    }
  }

  // ---- Income ----

  function handleExportIncome() {
    const csv = buildIncomeCsv(incomeSources ?? []);
    downloadTextFile("coffer-income.csv", csv);
  }

  async function handleIncomeFileSelected(file: File) {
    const text = await file.text();
    const outcome = parseIncomeCsv(text);
    if (outcome.missingHeaders.length > 0) {
      toast.error(`Missing required column${outcome.missingHeaders.length === 1 ? "" : "s"}: ${outcome.missingHeaders.join(", ")}`);
      return;
    }
    setIncomePreview(outcome);
  }

  async function handleConfirmIncomeImport() {
    if (!incomePreview) return;
    setIsImportingIncome(true);
    try {
      for (const row of incomePreview.validRows) {
        await createIncomeSource.mutateAsync({
          label: row.label,
          source: row.source,
          sourceDetails: row.sourceDetails,
          grossYearlyAmount: row.grossYearlyAmount,
          effectiveFrom: row.effectiveFrom,
          effectiveTo: row.effectiveTo,
        });
      }
      toast.success(`Imported ${incomePreview.validRows.length} income source${incomePreview.validRows.length === 1 ? "" : "s"}`);
      setIncomePreview(null);
    } catch {
      toast.error("Something went wrong partway through the import.");
    } finally {
      setIsImportingIncome(false);
    }
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <h1 className="font-display text-xl font-semibold">Import &amp; export</h1>
        <p className="text-sm text-muted-foreground">
          Manage your expenses and income as CSV files — Coffer's own format,
          not tied to any particular spreadsheet.
        </p>
      </div>

      {/* Expenses */}
      <Card className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Receipt className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-medium">Expenses</h2>
        </div>

        {!expensePreview && (
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={handleExportExpenses}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <CsvFileInput onFileSelected={handleExpenseFileSelected} label="Import CSV" />
          </div>
        )}

        {expensePreview && (
          <ImportPreview
            validCount={expensePreview.validRows.length}
            itemLabel="expense"
            skipped={expensePreview.skipped}
            previewRows={expensePreview.validRows.map((row: ParsedExpenseRow) => ({
              primary: row.description,
              secondary: `${row.categoryName} · ${row.frequency}`,
              amount: formatCurrency(row.amount),
            }))}
            onConfirm={handleConfirmExpenseImport}
            onCancel={() => setExpensePreview(null)}
            isImporting={isImportingExpenses}
          />
        )}

        <p className="text-xs text-muted-foreground">
          Required columns: Description, Category, Frequency, Amount. "Total
          Yearly" is included on export for reference only and is always
          recalculated, not imported.
        </p>
      </Card>

      {/* Income */}
      <Card className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-medium">Income</h2>
        </div>

        {!incomePreview && (
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={handleExportIncome}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <CsvFileInput onFileSelected={handleIncomeFileSelected} label="Import CSV" />
          </div>
        )}

        {incomePreview && (
          <ImportPreview
            validCount={incomePreview.validRows.length}
            itemLabel="income source"
            skipped={incomePreview.skipped}
            previewRows={incomePreview.validRows.map((row: ParsedIncomeRow) => ({
              primary: row.label,
              secondary: `From ${row.effectiveFrom.toISOString().slice(0, 10)}`,
              amount: formatCurrency(row.grossYearlyAmount),
            }))}
            onConfirm={handleConfirmIncomeImport}
            onCancel={() => setIncomePreview(null)}
            isImporting={isImportingIncome}
          />
        )}

        <p className="text-xs text-muted-foreground">
          Required columns: Label, Gross Yearly Amount, Effective From (dates
          as yyyy-mm-dd). "Gross Monthly" is informational only.
        </p>
      </Card>
    </main>
  );
}
