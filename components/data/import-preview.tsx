import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export type PreviewRow = { primary: string; secondary: string; amount: string };

type ImportPreviewProps = {
  validCount: number;
  itemLabel: string;
  skipped: { row: number; reason: string }[];
  previewRows: PreviewRow[];
  onConfirm: () => void;
  onCancel: () => void;
  isImporting: boolean;
};

export function ImportPreview({
  validCount,
  itemLabel,
  skipped,
  previewRows,
  onConfirm,
  onCancel,
  isImporting,
}: ImportPreviewProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-medium">
        {validCount} {itemLabel}
        {validCount === 1 ? "" : "s"} will be imported
      </p>

      {skipped.length > 0 && (
        <Card className="flex items-start gap-2 border-accent/40 bg-accent/10">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <div className="flex flex-col gap-1 text-sm text-muted-foreground">
            <p>
              {skipped.length} row{skipped.length === 1 ? "" : "s"} skipped:
            </p>
            <ul className="flex flex-col gap-0.5">
              {skipped.slice(0, 8).map((s, i) => (
                <li key={i}>
                  Row {s.row}: {s.reason}
                </li>
              ))}
              {skipped.length > 8 && <li>…and {skipped.length - 8} more</li>}
            </ul>
          </div>
        </Card>
      )}

      {previewRows.length > 0 && (
        <Card className="p-0">
          <ul className="max-h-72 divide-y divide-border overflow-y-auto">
            {previewRows.map((row, i) => (
              <li key={i} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{row.primary}</p>
                  <p className="truncate text-xs text-muted-foreground">{row.secondary}</p>
                </div>
                <span className="shrink-0 text-sm font-medium tabular-nums">{row.amount}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onConfirm} disabled={isImporting || validCount === 0}>
          {isImporting ? "Importing…" : `Import ${validCount} ${itemLabel}${validCount === 1 ? "" : "s"}`}
        </Button>
      </div>
    </div>
  );
}
