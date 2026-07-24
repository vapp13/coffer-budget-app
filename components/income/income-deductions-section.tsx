"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { DeductionRow } from "@/components/income/deduction-row";
import { DeductionForm } from "@/components/income/deduction-form";
import { useDeductions } from "@/hooks/use-deductions";
import { useUndoableDelete } from "@/hooks/use-undoable-delete";
import { useFormatting } from "@/hooks/use-formatting";
import type { Deduction, DeductionInput } from "@/lib/validation/deduction";

let draftIdCounter = 0;
function nextDraftId() {
  draftIdCounter += 1;
  return `draft-${draftIdCounter}`;
}

/** Firestore permission errors are almost always a security-rules problem,
 * not something the user can fix by "trying again" — so say so specifically
 * rather than showing the same generic message for every kind of failure. */
function deductionErrorMessage(error: unknown, action: "save" | "remove"): string {
  const code = (error as { code?: string })?.code;
  if (code === "permission-denied") {
    return "Permission denied — your Firestore security rules may need to be updated and redeployed.";
  }
  return action === "save"
    ? "Couldn't save that deduction — try again."
    : "Couldn't remove that deduction — try again.";
}

type IncomeDeductionsSectionProps = {
  grossYearlyAmount: number;
} & (
  | { mode: "live"; incomeSourceId: string }
  | { mode: "draft"; draftDeductions: Deduction[]; onDraftsChange: (drafts: Deduction[]) => void }
);

export function IncomeDeductionsSection(props: IncomeDeductionsSectionProps) {
  const { formatCurrency } = useFormatting();
  const grossMonthly = props.grossYearlyAmount / 12;

  // Always called (Rules of Hooks) — only actually enabled in "live" mode,
  // since draft mode has no real income source id to query yet.
  const liveIncomeSourceId = props.mode === "live" ? props.incomeSourceId : undefined;
  const {
    data: liveDeductions,
    isLoading: isLoadingLive,
    createDeduction,
    editDeduction,
    removeDeduction,
  } = useDeductions(liveIncomeSourceId);

  // Only ever invoked in "live" mode — draft-mode removal just filters the
  // local array directly, since nothing's persisted yet to undo.
  const { isPending: isPendingLiveDelete, deleteWithUndo: deleteLiveWithUndo } = useUndoableDelete<Deduction>({
    onCommit: (deduction) => removeDeduction.mutateAsync(deduction.id),
    getMessage: () => "Deduction removed",
    getErrorMessage: (_deduction, error) => deductionErrorMessage(error, "remove"),
  });

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const deductions: Deduction[] =
    props.mode === "live"
      ? (liveDeductions ?? []).filter((d) => !isPendingLiveDelete(d.id))
      : props.draftDeductions;
  const editingDeduction = editingId ? deductions.find((d) => d.id === editingId) ?? null : null;

  function closeForm() {
    setIsAdding(false);
    setEditingId(null);
  }

  async function handleSubmit(input: DeductionInput) {
    if (props.mode === "live") {
      try {
        if (editingDeduction) {
          await editDeduction.mutateAsync({ id: editingDeduction.id, input });
          toast.success("Deduction updated");
        } else {
          await createDeduction.mutateAsync(input);
          toast.success("Deduction added");
        }
        closeForm();
      } catch (error) {
        console.error("Failed to save deduction:", error);
        toast.error(deductionErrorMessage(error, "save"));
      }
      return;
    }

    if (editingDeduction) {
      props.onDraftsChange(
        deductions.map((d) => (d.id === editingDeduction.id ? { ...input, id: d.id } : d))
      );
    } else {
      props.onDraftsChange([...deductions, { ...input, id: nextDraftId() }]);
    }
    closeForm();
  }

  function handleDelete(deduction: Deduction) {
    if (props.mode === "live") {
      deleteLiveWithUndo(deduction);
    } else {
      props.onDraftsChange(deductions.filter((d) => d.id !== deduction.id));
    }
  }

  const isSubmittingLive = props.mode === "live" && (createDeduction.isPending || editDeduction.isPending);
  const isLoading = props.mode === "live" && isLoadingLive;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <div className="flex items-center gap-1.5">
        <h3 className="text-sm font-medium">Deductions (optional)</h3>
        <InfoTooltip title="Deductions">
          For the most accurate budget calculations, enter the deduction values shown on your
          payslip whenever possible. Automatic estimates are provided for convenience but may
          differ from your actual deductions.
        </InfoTooltip>
      </div>

      {isLoading && <p className="text-xs text-muted-foreground">Loading…</p>}

      {!isLoading && deductions.length > 0 && (
        <ul className="flex flex-col divide-y divide-border">
          {deductions.map((deduction) => (
            <DeductionRow
              key={deduction.id}
              deduction={deduction}
              percentageOfGross={grossMonthly > 0 ? (deduction.amount / grossMonthly) * 100 : 0}
              formatCurrency={formatCurrency}
              onEdit={() => {
                setEditingId(deduction.id);
                setIsAdding(false);
              }}
              onDelete={() => handleDelete(deduction)}
            />
          ))}
        </ul>
      )}

      {!isLoading && deductions.length === 0 && !isAdding && (
        <p className="text-xs text-muted-foreground">
          No deductions added — net income will use the automatic estimate.
        </p>
      )}

      {(isAdding || editingDeduction) && (
        <div className="flex flex-col gap-4 border-t border-border pt-3">
          <DeductionForm
            defaultValues={editingDeduction ?? undefined}
            onSubmit={handleSubmit}
            onCancel={closeForm}
            isSubmitting={isSubmittingLive}
            submitLabel={editingDeduction ? "Save changes" : "Add deduction"}
          />
        </div>
      )}

      {!isAdding && !editingDeduction && (
        <Button type="button" variant="outline" onClick={() => setIsAdding(true)}>
          <Plus className="h-4 w-4" />
          Add deduction
        </Button>
      )}
    </div>
  );
}
