import {
  createPdfDoc,
  addHeader,
  addSectionTitle,
  addTable,
  addFooterAndSave,
  slugifyForFilename,
} from "@/lib/pdf/pdf-builder";
import type { Comparison } from "@/lib/calculations/comparison";
import type { MonthlyDataPoint } from "@/lib/calculations/monthly-series";

function formatChange(comparison: Comparison): string {
  if (comparison.percentChange === null) {
    return comparison.absoluteChange >= 0 ? "+" : "−";
  }
  const sign = comparison.percentChange >= 0 ? "+" : "";
  return `${sign}${comparison.percentChange.toFixed(1)}%`;
}

function seriesRows(series: MonthlyDataPoint[], formatCurrency: (value: number) => string): string[][] {
  return series.map((point) => [
    point.label,
    formatCurrency(point.income),
    formatCurrency(point.expenses),
    formatCurrency(point.remaining),
  ]);
}

export function exportReportsPdf(
  monthOverMonth: Comparison,
  yearOverYear: Comparison,
  trendSeries: MonthlyDataPoint[],
  forecastSeries: MonthlyDataPoint[],
  monthLabelText: string,
  formatCurrency: (value: number) => string
): void {
  const doc = createPdfDoc();
  let y = addHeader(doc, "Financial Report", monthLabelText);

  y = addSectionTitle(doc, "Expense Comparisons", y);
  y = addTable(
    doc,
    ["", "This period", "Compared to", "Change"],
    [
      [
        "Vs. last month",
        formatCurrency(monthOverMonth.current),
        formatCurrency(monthOverMonth.previous),
        formatChange(monthOverMonth),
      ],
      [
        "Vs. same month last year",
        formatCurrency(yearOverYear.current),
        formatCurrency(yearOverYear.previous),
        formatChange(yearOverYear),
      ],
    ],
    y
  );

  if (trendSeries.length > 0) {
    y = addSectionTitle(doc, "Spending Trend", y);
    y = addTable(doc, ["Month", "Income", "Expenses", "Remaining"], seriesRows(trendSeries, formatCurrency), y);
  }

  if (forecastSeries.length > 0) {
    y = addSectionTitle(doc, "Forecast", y);
    y = addTable(doc, ["Month", "Income", "Expenses", "Remaining"], seriesRows(forecastSeries, formatCurrency), y);
  }

  addFooterAndSave(doc, `coffer-report-${slugifyForFilename(monthLabelText)}.pdf`);
}
