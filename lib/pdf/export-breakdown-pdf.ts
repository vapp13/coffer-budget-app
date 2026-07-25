import {
  createPdfDoc,
  addHeader,
  addSectionTitle,
  addKeyValueRows,
  addTable,
  addFooterAndSave,
  slugifyForFilename,
} from "@/lib/pdf/pdf-builder";
import { calculateSavingsBreakdown } from "@/lib/calculations/savings";
import type { BudgetSummary } from "@/lib/calculations/budget-summary";

export function exportBreakdownPdf(
  summary: BudgetSummary,
  monthLabelText: string,
  formatCurrency: (value: number) => string
): void {
  const doc = createPdfDoc();
  let y = addHeader(doc, "Budget Breakdown", monthLabelText);

  y = addSectionTitle(doc, "Income Breakdown", y);
  y = addTable(
    doc,
    ["", "Gross", "Net"],
    [
      ["Yearly", formatCurrency(summary.income.gross.yearly), formatCurrency(summary.income.net.yearly)],
      ["Monthly", formatCurrency(summary.income.gross.monthly), formatCurrency(summary.income.net.monthly)],
      ["Weekly", formatCurrency(summary.income.gross.weekly), formatCurrency(summary.income.net.weekly)],
      ["Daily", formatCurrency(summary.income.gross.daily), formatCurrency(summary.income.net.daily)],
      ["Hourly", formatCurrency(summary.income.gross.hourly), formatCurrency(summary.income.net.hourly)],
    ],
    y
  );

  const savings = calculateSavingsBreakdown(summary);
  y = addSectionTitle(doc, "Savings Rate", y);
  y = addKeyValueRows(
    doc,
    [
      ["Savings rate", `${(savings.savingsRate * 100).toFixed(1)}%`],
      ["Savings category spend", formatCurrency(savings.savingsCategoryMonthly)],
      ["Unallocated remaining budget", formatCurrency(Math.max(0, savings.remainingMonthly))],
      ["Total savings", formatCurrency(savings.totalSavingsMonthly)],
    ],
    y
  );

  const spendingCategories = [...summary.categories]
    .filter((c) => c.monthly > 0)
    .sort((a, b) => b.monthly - a.monthly);

  if (spendingCategories.length > 0) {
    y = addSectionTitle(doc, "Expense Breakdown", y);
    y = addTable(
      doc,
      ["Category", "Yearly", "Monthly", "% of expenses"],
      spendingCategories.map((c) => [
        c.categoryName,
        formatCurrency(c.yearly),
        formatCurrency(c.monthly),
        `${(summary.totalMonthlyExpenses > 0 ? (c.monthly / summary.totalMonthlyExpenses) * 100 : 0).toFixed(1)}%`,
      ]),
      y
    );

    const totalYearly = summary.categories.reduce((sum, c) => sum + c.yearly, 0);
    y = addKeyValueRows(
      doc,
      [
        ["Total yearly expenses", formatCurrency(totalYearly)],
        ["Total monthly expenses", formatCurrency(summary.totalMonthlyExpenses)],
        ["Remaining disposable income", formatCurrency(summary.remaining.monthly)],
        ["Remaining, as % of net income", `${(summary.remaining.percentageOfIncome * 100).toFixed(1)}%`],
      ],
      y
    );
  }

  addFooterAndSave(doc, `coffer-breakdown-${slugifyForFilename(monthLabelText)}.pdf`);
}
