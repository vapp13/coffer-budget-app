"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { useDebts } from "@/hooks/use-debts";
import { useBudgetSummary } from "@/hooks/use-budget-summary";
import { useFormatting } from "@/hooks/use-formatting";
import { useUndoableDelete } from "@/hooks/use-undoable-delete";
import { toDateInputValue } from "@/lib/date-input-value";
import { calculateDebtToIncomeRatio } from "@/lib/calculations/debt";
import { DebtForm } from "@/components/debts/debt-form";
import { DebtCard } from "@/components/debts/debt-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import type { Debt, DebtInput } from "@/lib/validation/debt";

export default function DebtsPage() {
  const { data: debts, isLoading, createDebt, editDebt, removeDebt } = useDebts();
  const { summary } = useBudgetSummary();
  const { formatCurrency } = useFormatting();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);

  const { isPending: isPendingDelete, deleteWithUndo } = useUndoableDelete<Debt>({
    onCommit: (debt) => removeDebt.mutateAsync(debt.id),
    getMessage: (debt) => `Removed "${debt.name}"`,
    getErrorMessage: (debt) => `Couldn't remove "${debt.name}" — try again.`,
  });

  function openAddModal() {
    setEditingDebt(null);
    setIsFormOpen(true);
  }

  function openEditModal(debt: Debt) {
    setEditingDebt(debt);
    setIsFormOpen(true);
  }

  async function handleSubmit(input: DebtInput) {
    try {
      if (editingDebt) {
        await editDebt.mutateAsync({ id: editingDebt.id, input });
        toast.success("Debt updated");
      } else {
        await createDebt.mutateAsync(input);
        toast.success("Debt added");
      }
      setIsFormOpen(false);
      setEditingDebt(null);
    } catch {
      toast.error(editingDebt ? "Couldn't update that debt — try again." : "Couldn't add that debt — try again.");
    }
  }

  const visibleDebts = (debts ?? []).filter((d) => !isPendingDelete(d.id));
  const totalBalance = visibleDebts.reduce((sum, d) => sum + d.currentBalance, 0);
  const totalMonthlyPayments = visibleDebts.reduce((sum, d) => sum + (d.minimumPayment ?? 0), 0);
  const debtToIncomeRatio = summary
    ? calculateDebtToIncomeRatio(totalMonthlyPayments, summary.income.gross.monthly)
    : null;

  const editDefaultValues = editingDebt
    ? {
        name: editingDebt.name,
        type: editingDebt.type,
        currentBalance: editingDebt.currentBalance,
        originalAmount: editingDebt.originalAmount,
        interestRate: editingDebt.interestRate,
        minimumPayment: editingDebt.minimumPayment,
        linkedCategoryId: editingDebt.linkedCategoryId,
        notes: editingDebt.notes,
        startDate: toDateInputValue(editingDebt.startDate),
      }
    : undefined;

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <Link
        href="/dashboard"
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-semibold">Debts</h1>
          <p className="text-sm text-muted-foreground">Loans and credit cards, with payoff projections.</p>
        </div>
        <Button onClick={openAddModal}>
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      {!isLoading && visibleDebts.length > 0 && (
        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total debt</span>
            <span className="font-display text-lg font-semibold tabular-nums text-negative">
              {formatCurrency(totalBalance)}
            </span>
          </div>
          {debtToIncomeRatio !== null && (
            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                Debt-to-income ratio
                <InfoTooltip title="Debt-to-income ratio">
                  Your total monthly debt payments (only debts with a monthly payment entered)
                  divided by your gross monthly income. Lenders often look for this to be under
                  36% — lower generally means more breathing room in your budget.
                </InfoTooltip>
              </span>
              <span className="text-sm font-semibold tabular-nums">
                {(debtToIncomeRatio * 100).toFixed(1)}%
              </span>
            </div>
          )}
        </Card>
      )}

      {isLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="flex flex-col gap-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-2 w-full" />
            </Card>
          ))}
        </div>
      )}

      {!isLoading && visibleDebts.length === 0 && (
        <Card className="p-0">
          <EmptyState
            icon={CreditCard}
            title="No debts tracked"
            description="Add a loan or credit card to track its balance and see a payoff projection."
            action={<Button onClick={openAddModal}>Add a debt</Button>}
          />
        </Card>
      )}

      {!isLoading && visibleDebts.length > 0 && (
        <div className="flex flex-col gap-3">
          {visibleDebts.map((debt) => (
            <DebtCard
              key={debt.id}
              debt={debt}
              formatCurrency={formatCurrency}
              onEdit={() => openEditModal(debt)}
              onDelete={() => deleteWithUndo(debt)}
            />
          ))}
        </div>
      )}

      <Dialog
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingDebt(null);
        }}
        title={editingDebt ? "Edit debt" : "Add a debt"}
      >
        <DebtForm
          defaultValues={editDefaultValues}
          onSubmit={handleSubmit}
          isSubmitting={createDebt.isPending || editDebt.isPending}
          submitLabel={editingDebt ? "Save changes" : "Add debt"}
        />
      </Dialog>
    </main>
  );
}
