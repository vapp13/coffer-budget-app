"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Wallet, Plus } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DeductionRow } from "@/components/income/deduction-row";
import { DeductionForm } from "@/components/income/deduction-form";
import { useDeductions } from "@/hooks/use-deductions";
import { useFormatting } from "@/hooks/use-formatting";
import type { IncomeSource } from "@/lib/validation/income-source";
import type { Deduction, DeductionInput } from "@/lib/validation/deduction";

type ManageDeductionsDialogProps = {
  open: boolean;
  onClose: () => void;
  incomeSources: IncomeSource[];
};

export function ManageDeductionsDialog({ open, onClose, incomeSources }: ManageDeductionsDialogProps) {
  const [selectedId, setSelectedId] = useState<string>(incomeSources[0]?.id ?? "");
  const [isAdding, setIsAdding] = useState(false);
  const [editingDeduction, setEditingDeduction] = useState<Deduction | null>(null);
  const [deletingDeduction, setDeletingDeduction] = useState<Deduction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const selectedSource = incomeSources.find((s) => s.id === selectedId);
  const { data: deductions, isLoading, createDeduction, editDeduction, removeDeduction } =
    useDeductions(selectedSource?.id);
  const { formatCurrency } = useFormatting();

  const grossMonthly = selectedSource ? selectedSource.grossYearlyAmount / 12 : 0;

  function closeForm() {
    setIsAdding(false);
    setEditingDeduction(null);
  }

  async function handleSubmit(input: DeductionInput) {
    try {
      if (editingDeduction) {
        await editDeduction.mutateAsync({ id: editingDeduction.id, input });
        toast.success("Deduction updated");
      } else {
        await createDeduction.mutateAsync(input);
        toast.success("Deduction added");
      }
      closeForm();
    } catch {
      toast.error("Couldn't save that deduction — try again.");
    }
  }

  async function handleConfirmDelete() {
    if (!deletingDeduction) return;
    setIsDeleting(true);
    try {
      await removeDeduction.mutateAsync(deletingDeduction.id);
      toast.success("Deduction removed");
      setDeletingDeduction(null);
    } catch {
      toast.error("Couldn't remove that deduction — try again.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Manage deductions">
      {incomeSources.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Add an income source first"
          description="Deductions belong to a specific income source — create one before adding deductions."
          action={
            <Link href="/income" onClick={onClose}>
              <Button>Go to Income</Button>
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Label htmlFor="income-source-select">Income source</Label>
            <Select
              id="income-source-select"
              value={selectedId}
              onChange={(event) => {
                setSelectedId(event.target.value);
                closeForm();
              }}
            >
              {incomeSources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.label}
                </option>
              ))}
            </Select>
          </div>

          {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

          {!isLoading && deductions && deductions.length > 0 && (
            <ul className="divide-y divide-border rounded-lg border border-border">
              {deductions.map((deduction) => (
                <DeductionRow
                  key={deduction.id}
                  deduction={deduction}
                  percentageOfGross={grossMonthly > 0 ? (deduction.amount / grossMonthly) * 100 : 0}
                  formatCurrency={formatCurrency}
                  onEdit={() => {
                    setEditingDeduction(deduction);
                    setIsAdding(false);
                  }}
                  onDelete={() => setDeletingDeduction(deduction)}
                />
              ))}
            </ul>
          )}

          {!isLoading && deductions?.length === 0 && !isAdding && (
            <p className="text-sm text-muted-foreground">
              No deductions yet for {selectedSource?.label} — net income falls back to the automatic estimate.
            </p>
          )}

          {(isAdding || editingDeduction) && (
            <DeductionForm
              defaultValues={editingDeduction ?? undefined}
              onSubmit={handleSubmit}
              onCancel={closeForm}
              isSubmitting={createDeduction.isPending || editDeduction.isPending}
              submitLabel={editingDeduction ? "Save changes" : "Add deduction"}
            />
          )}

          {!isAdding && !editingDeduction && (
            <Button variant="outline" onClick={() => setIsAdding(true)}>
              <Plus className="h-4 w-4" />
              Add deduction
            </Button>
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!deletingDeduction}
        title="Remove this deduction?"
        description="This will be permanently removed and net income will be recalculated."
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingDeduction(null)}
        isConfirming={isDeleting}
      />
    </Dialog>
  );
}
