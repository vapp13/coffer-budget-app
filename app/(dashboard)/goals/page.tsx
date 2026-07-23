"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Target } from "lucide-react";
import { toast } from "sonner";
import { useGoals } from "@/hooks/use-goals";
import { useFormatting } from "@/hooks/use-formatting";
import { toDateInputValue } from "@/lib/date-input-value";
import { GoalForm } from "@/components/goals/goal-form";
import { GoalCard } from "@/components/goals/goal-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { Goal, GoalInput } from "@/lib/validation/goal";

export default function GoalsPage() {
  const { data: goals, isLoading, createGoal, editGoal, removeGoal } = useGoals();
  const { formatCurrency, formatDate } = useFormatting();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [deletingGoal, setDeletingGoal] = useState<Goal | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  function openAddModal() {
    setEditingGoal(null);
    setIsFormOpen(true);
  }

  function openEditModal(goal: Goal) {
    setEditingGoal(goal);
    setIsFormOpen(true);
  }

  async function handleSubmit(input: GoalInput) {
    try {
      if (editingGoal) {
        await editGoal.mutateAsync({ id: editingGoal.id, input });
        toast.success("Goal updated");
      } else {
        await createGoal.mutateAsync(input);
        toast.success("Goal added");
      }
      setIsFormOpen(false);
      setEditingGoal(null);
    } catch {
      toast.error(editingGoal ? "Couldn't update that goal — try again." : "Couldn't add that goal — try again.");
    }
  }

  async function handleConfirmDelete() {
    if (!deletingGoal) return;
    setIsDeleting(true);
    try {
      await removeGoal.mutateAsync(deletingGoal.id);
      toast.success(`Removed "${deletingGoal.name}"`);
      setDeletingGoal(null);
    } catch {
      toast.error("Couldn't remove that goal — try again.");
    } finally {
      setIsDeleting(false);
    }
  }

  const editDefaultValues = editingGoal
    ? {
        name: editingGoal.name,
        type: editingGoal.type,
        targetAmount: editingGoal.targetAmount,
        currentAmount: editingGoal.currentAmount,
        targetDate: toDateInputValue(editingGoal.targetDate),
        linkedCategoryId: editingGoal.linkedCategoryId,
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
          <h1 className="font-display text-xl font-semibold">Goals</h1>
          <p className="text-sm text-muted-foreground">Savings and investment targets.</p>
        </div>
        <Button onClick={openAddModal}>
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

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

      {!isLoading && goals?.length === 0 && (
        <Card className="p-0">
          <EmptyState
            icon={Target}
            title="No goals yet"
            description="Set a savings or investment target to track your progress toward it."
            action={<Button onClick={openAddModal}>Add a goal</Button>}
          />
        </Card>
      )}

      {!isLoading && goals && goals.length > 0 && (
        <div className="flex flex-col gap-3">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              onEdit={() => openEditModal(goal)}
              onDelete={() => setDeletingGoal(goal)}
            />
          ))}
        </div>
      )}

      <Dialog
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingGoal(null);
        }}
        title={editingGoal ? "Edit goal" : "Add a goal"}
      >
        <GoalForm
          defaultValues={editDefaultValues}
          onSubmit={handleSubmit}
          isSubmitting={createGoal.isPending || editGoal.isPending}
          submitLabel={editingGoal ? "Save changes" : "Add goal"}
        />
      </Dialog>

      <ConfirmDialog
        open={!!deletingGoal}
        title="Remove this goal?"
        description={
          deletingGoal ? `"${deletingGoal.name}" will be permanently removed. This can't be undone.` : ""
        }
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingGoal(null)}
        isConfirming={isDeleting}
      />
    </main>
  );
}
