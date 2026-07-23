"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Receipt, ArrowUpDown, LayoutGrid, Archive } from "lucide-react";
import { toast } from "sonner";
import { useExpenses } from "@/hooks/use-expenses";
import { useCategories } from "@/hooks/use-categories";
import { useFormatting } from "@/hooks/use-formatting";
import { ExpenseForm } from "@/components/forms/expense-form";
import { ExpenseItem } from "@/components/expenses/expense-item";
import { ExpenseDetailsModal } from "@/components/expenses/expense-details-modal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ListRowSkeleton } from "@/components/ui/list-row-skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { SORT_OPTIONS, sortItems, type SortOption } from "@/lib/sort";
import { groupBy } from "@/lib/group-by";
import { toDateInputValue } from "@/lib/date-input-value";
import { isEndingThisMonth } from "@/lib/calculations/archive-logic";
import { monthKeyFromDate } from "@/lib/date/month";
import {
  resolveExpenseType,
  EXPENSE_TYPE_LABELS,
  type Expense,
  type ExpenseInput,
  type ExpenseType,
} from "@/lib/validation/expense";

type ViewOption = "list" | "card" | "group-category" | "group-type";
const VIEW_OPTIONS: { value: ViewOption; label: string }[] = [
  { value: "list", label: "List view" },
  { value: "card", label: "Card view" },
  { value: "group-category", label: "Group by category" },
  { value: "group-type", label: "Group by type" },
];

const CURRENT_MONTH = monthKeyFromDate(new Date());

export default function ExpensesPage() {
  const {
    data: expenses,
    isLoading,
    createExpense,
    editExpense,
    removeExpense,
    archiveExpense,
    restoreExpense,
  } = useExpenses();
  const { data: categories } = useCategories();
  const { formatCurrency, formatDate } = useFormatting();

  const [sort, setSort] = useState<SortOption>("az");
  const [view, setView] = useState<ViewOption>("list");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  function categoryName(categoryId: string) {
    return categories?.find((c) => c.id === categoryId)?.name ?? "Uncategorized";
  }

  function openAddModal() {
    setEditingExpense(null);
    setIsFormOpen(true);
  }

  function openEditModal(expense: Expense) {
    setEditingExpense(expense);
    setIsFormOpen(true);
  }

  async function handleFormSubmit(input: ExpenseInput) {
    try {
      if (editingExpense) {
        await editExpense.mutateAsync({ id: editingExpense.id, input });
        toast.success("Expense updated");
      } else {
        await createExpense.mutateAsync(input);
        toast.success("Expense added");
      }
      setIsFormOpen(false);
      setEditingExpense(null);
    } catch {
      toast.error(editingExpense ? "Couldn't update that expense — try again." : "Couldn't add that expense — try again.");
    }
  }

  async function handleConfirmDelete() {
    if (!deletingExpense) return;
    setIsDeleting(true);
    try {
      await removeExpense.mutateAsync(deletingExpense.id);
      toast.success(`Removed "${deletingExpense.description}"`);
      setDeletingExpense(null);
    } catch {
      toast.error("Couldn't remove that expense — try again.");
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleArchive(expense: Expense) {
    try {
      await archiveExpense.mutateAsync(expense.id);
      toast.success(`Archived "${expense.description}"`);
    } catch {
      toast.error("Couldn't archive that expense — try again.");
    }
  }

  async function handleRestore(expense: Expense) {
    try {
      await restoreExpense.mutateAsync(expense.id);
      toast.success(`Restored "${expense.description}"`);
    } catch {
      toast.error("Couldn't restore that expense — try again.");
    }
  }

  const activeExpenses = (expenses ?? []).filter((e) => e.isActive);
  const archivedExpenses = (expenses ?? []).filter((e) => !e.isActive);

  const sortedExpenses = sortItems(
    activeExpenses,
    sort,
    (e) => e.description,
    (e) => e.unitCost
  );

  const editDefaultValues = editingExpense
    ? {
        description: editingExpense.description,
        categoryId: editingExpense.categoryId,
        unitCost: editingExpense.unitCost,
        frequency: editingExpense.frequency,
        expenseType: editingExpense.expenseType,
        startDate: toDateInputValue(editingExpense.startDate),
        endDate: toDateInputValue(editingExpense.endDate),
        notes: editingExpense.notes,
        isActive: editingExpense.isActive,
      }
    : undefined;

  function renderList(items: Expense[], options: { archived?: boolean } = {}) {
    return (
      <ul className="divide-y divide-border">
        {items.map((expense) => (
          <ExpenseItem
            key={expense.id}
            expense={expense}
            categoryName={categoryName(expense.categoryId)}
            formatCurrency={formatCurrency}
            variant="list"
            isEndingThisMonth={isEndingThisMonth(expense, CURRENT_MONTH)}
            isArchived={options.archived}
            onViewDetails={() => setViewingExpense(expense)}
            onEdit={() => openEditModal(expense)}
            onArchive={() => (options.archived ? handleRestore(expense) : handleArchive(expense))}
            onDelete={() => setDeletingExpense(expense)}
          />
        ))}
      </ul>
    );
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <Link
        href="/dashboard"
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-semibold">Expenses</h1>
          <p className="text-sm text-muted-foreground">
            Raw expense entries — the only source of truth.
          </p>
        </div>
        <Button onClick={openAddModal}>
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      {!isLoading && activeExpenses.length > 0 && (
        <div className="flex flex-wrap gap-3">
          <DropdownMenu
            label="Sort"
            icon={ArrowUpDown}
            options={SORT_OPTIONS}
            value={sort}
            onChange={setSort}
          />
          <DropdownMenu
            label="View"
            icon={LayoutGrid}
            options={VIEW_OPTIONS}
            value={view}
            onChange={setView}
          />
        </div>
      )}

      {isLoading && (
        <Card className="p-0">
          <div className="divide-y divide-border">
            {Array.from({ length: 4 }).map((_, i) => (
              <ListRowSkeleton key={i} />
            ))}
          </div>
        </Card>
      )}

      {!isLoading && activeExpenses.length === 0 && (
        <Card className="p-0">
          <EmptyState
            icon={Receipt}
            title="No active expenses"
            description="Add your first expense to start tracking where your money goes."
            action={<Button onClick={openAddModal}>Add an expense</Button>}
          />
        </Card>
      )}

      {!isLoading && sortedExpenses.length > 0 && view === "list" && (
        <Card className="p-0">{renderList(sortedExpenses)}</Card>
      )}

      {!isLoading && sortedExpenses.length > 0 && view === "card" && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {sortedExpenses.map((expense) => (
            <ExpenseItem
              key={expense.id}
              expense={expense}
              categoryName={categoryName(expense.categoryId)}
              formatCurrency={formatCurrency}
              variant="card"
              isEndingThisMonth={isEndingThisMonth(expense, CURRENT_MONTH)}
              onViewDetails={() => setViewingExpense(expense)}
              onEdit={() => openEditModal(expense)}
              onArchive={() => handleArchive(expense)}
              onDelete={() => setDeletingExpense(expense)}
            />
          ))}
        </div>
      )}

      {!isLoading && sortedExpenses.length > 0 && view === "group-category" && (
        <div className="flex flex-col gap-5">
          {[...groupBy(sortedExpenses, (e) => e.categoryId).entries()]
            .sort(([a], [b]) => categoryName(a).localeCompare(categoryName(b)))
            .map(([categoryId, items]) => (
              <div key={categoryId} className="flex flex-col gap-2">
                <h2 className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {categoryName(categoryId)} · {items.length}
                </h2>
                <Card className="p-0">{renderList(items)}</Card>
              </div>
            ))}
        </div>
      )}

      {!isLoading && sortedExpenses.length > 0 && view === "group-type" && (
        <div className="flex flex-col gap-5">
          {[...groupBy(sortedExpenses, (e) => resolveExpenseType(e)).entries()]
            .sort(([a], [b]) =>
              EXPENSE_TYPE_LABELS[a as ExpenseType].localeCompare(EXPENSE_TYPE_LABELS[b as ExpenseType])
            )
            .map(([type, items]) => (
              <div key={type} className="flex flex-col gap-2">
                <h2 className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {EXPENSE_TYPE_LABELS[type as ExpenseType]} · {items.length}
                </h2>
                <Card className="p-0">{renderList(items)}</Card>
              </div>
            ))}
        </div>
      )}

      {!isLoading && archivedExpenses.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="flex items-center gap-2 px-1 text-sm font-medium text-muted-foreground">
            <Archive className="h-4 w-4" />
            Archived expenses · {archivedExpenses.length}
          </h2>
          <Card className="p-0">
            {renderList(
              sortItems(archivedExpenses, "az", (e) => e.description, (e) => e.unitCost),
              { archived: true }
            )}
          </Card>
        </div>
      )}

      <Dialog
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingExpense(null);
        }}
        title={editingExpense ? "Edit expense" : "Add an expense"}
      >
        <ExpenseForm
          defaultValues={editDefaultValues}
          onSubmit={handleFormSubmit}
          isSubmitting={createExpense.isPending || editExpense.isPending}
          submitLabel={editingExpense ? "Save changes" : "Add expense"}
        />
      </Dialog>

      <ExpenseDetailsModal
        expense={viewingExpense}
        categoryName={viewingExpense ? categoryName(viewingExpense.categoryId) : ""}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        onClose={() => setViewingExpense(null)}
      />

      <ConfirmDialog
        open={!!deletingExpense}
        title="Remove this expense?"
        description={
          deletingExpense
            ? `"${deletingExpense.description}" will be permanently removed. This can't be undone.`
            : ""
        }
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingExpense(null)}
        isConfirming={isDeleting}
      />
    </main>
  );
}
