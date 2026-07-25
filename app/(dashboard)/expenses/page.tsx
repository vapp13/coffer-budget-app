"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Receipt, Archive, Search, X } from "lucide-react";
import { toast } from "sonner";
import { useExpenses } from "@/hooks/use-expenses";
import { useCategories } from "@/hooks/use-categories";
import { useFormatting } from "@/hooks/use-formatting";
import { useUndoableDelete } from "@/hooks/use-undoable-delete";
import { usePersistentState } from "@/hooks/use-persistent-state";
import { ExpenseForm } from "@/components/forms/expense-form";
import { ExpenseItem } from "@/components/expenses/expense-item";
import { ExpenseDetailsModal } from "@/components/expenses/expense-details-modal";
import { ExpenseTypeTabs, type ExpenseTypeFilter } from "@/components/expenses/expense-type-tabs";
import { ExpenseSummaryCard } from "@/components/expenses/expense-summary-card";
import { ExpenseFilterSheet, type GroupOption } from "@/components/expenses/expense-filter-sheet";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ListRowSkeleton } from "@/components/ui/list-row-skeleton";
import { sortItems, type SortOption } from "@/lib/sort";
import { groupBy } from "@/lib/group-by";
import { toDateInputValue } from "@/lib/date-input-value";
import { isEndingThisMonth } from "@/lib/calculations/archive-logic";
import { monthKeyFromDate } from "@/lib/date/month";
import { resolveExpenseType, type Expense, type ExpenseInput } from "@/lib/validation/expense";

const CURRENT_MONTH = monthKeyFromDate(new Date());
const SWIPE_THRESHOLD_PX = 60;
const TAB_ORDER: ExpenseTypeFilter[] = ["all", "recurring", "one_time"];

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

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = usePersistentState<ExpenseTypeFilter>(
    "coffer-expenses-type-filter",
    "all"
  );
  const [sort, setSort] = usePersistentState<SortOption>("coffer-expenses-sort", "az");
  const [group, setGroup] = usePersistentState<GroupOption>("coffer-expenses-group", "none");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);

  const touchStartX = useRef<number | null>(null);

  function categoryName(categoryId: string) {
    return categories?.find((c) => c.id === categoryId)?.name ?? "Uncategorized";
  }

  function categoryColor(categoryId: string) {
    return categories?.find((c) => c.id === categoryId)?.color ?? "#8A9199";
  }

  const { isPending: isPendingDelete, deleteWithUndo } = useUndoableDelete<Expense>({
    onCommit: (expense) => removeExpense.mutateAsync(expense.id),
    getMessage: (expense) => `Removed "${expense.description}"`,
    getErrorMessage: (expense) => `Couldn't remove "${expense.description}" — try again.`,
  });

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

  async function handleDuplicate(expense: Expense) {
    try {
      await createExpense.mutateAsync({
        description: `${expense.description} (copy)`,
        categoryId: expense.categoryId,
        unitCost: expense.unitCost,
        frequency: expense.frequency,
        expenseType: expense.expenseType,
        startDate: expense.startDate,
        endDate: expense.endDate,
        notes: expense.notes,
        isActive: true,
      });
      toast.success("Expense duplicated");
    } catch {
      toast.error("Couldn't duplicate that expense — try again.");
    }
  }

  async function handleArchive(expense: Expense) {
    try {
      await archiveExpense.mutateAsync(expense.id);
      toast(`Archived "${expense.description}"`, {
        action: { label: "Undo", onClick: () => restoreExpense.mutate(expense.id) },
      });
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

  function matchesQuery(expense: Expense) {
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    return (
      expense.description.toLowerCase().includes(q) ||
      categoryName(expense.categoryId).toLowerCase().includes(q) ||
      (expense.notes ?? "").toLowerCase().includes(q)
    );
  }

  function matchesTypeFilter(expense: Expense) {
    if (typeFilter === "all") return true;
    return resolveExpenseType(expense) === typeFilter;
  }

  const notDeleting = (e: Expense) => !isPendingDelete(e.id);
  const activeExpenses = (expenses ?? []).filter(
    (e) => e.isActive && notDeleting(e) && matchesQuery(e) && matchesTypeFilter(e)
  );
  const archivedExpenses = (expenses ?? []).filter(
    (e) => !e.isActive && notDeleting(e) && matchesQuery(e) && matchesTypeFilter(e)
  );

  const sortedExpenses = sortItems(activeExpenses, sort, (e) => e.description, (e) => e.unitCost);
  const hasAnyExpenses = (expenses ?? []).length > 0;

  function handleTouchStart(event: React.TouchEvent) {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(event: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const deltaX = endX - touchStartX.current;
    touchStartX.current = null;

    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return;
    const currentIndex = TAB_ORDER.indexOf(typeFilter);
    if (deltaX < 0 && currentIndex < TAB_ORDER.length - 1) {
      setTypeFilter(TAB_ORDER[currentIndex + 1]!);
    } else if (deltaX > 0 && currentIndex > 0) {
      setTypeFilter(TAB_ORDER[currentIndex - 1]!);
    }
  }

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

  function renderCard(expense: Expense, options: { archived?: boolean } = {}) {
    return (
      <ExpenseItem
        key={expense.id}
        expense={expense}
        categoryName={categoryName(expense.categoryId)}
        categoryColor={categoryColor(expense.categoryId)}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        isEndingThisMonth={isEndingThisMonth(expense, CURRENT_MONTH)}
        isArchived={options.archived}
        onViewDetails={() => setViewingExpense(expense)}
        onEdit={() => openEditModal(expense)}
        onDuplicate={() => handleDuplicate(expense)}
        onArchive={() => (options.archived ? handleRestore(expense) : handleArchive(expense))}
        onDelete={() => deleteWithUndo(expense)}
      />
    );
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 px-4 pb-8 pt-6 sm:px-6">
      <Link
        href="/dashboard"
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Expenses</h1>
        <button
          type="button"
          onClick={openAddModal}
          aria-label="Add expense"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition active:scale-90"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      <ExpenseTypeTabs value={typeFilter} onChange={setTypeFilter} />

      {!isLoading && hasAnyExpenses && (
        <ExpenseSummaryCard expenses={activeExpenses} formatCurrency={formatCurrency} />
      )}

      {!isLoading && hasAnyExpenses && (
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search expenses…"
              className="pl-9 pr-9"
              aria-label="Search expenses"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <ExpenseFilterSheet sort={sort} onSortChange={setSort} group={group} onGroupChange={setGroup} />
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="rounded-2xl p-0">
              <ListRowSkeleton />
            </Card>
          ))}
        </div>
      )}

      {!isLoading && !hasAnyExpenses && (
        <Card className="rounded-2xl p-0">
          <EmptyState
            icon={Receipt}
            title="No active expenses"
            description="Add your first expense to start tracking where your money goes."
          />
        </Card>
      )}

      {!isLoading && hasAnyExpenses && sortedExpenses.length === 0 && archivedExpenses.length === 0 && (
        <Card className="rounded-2xl p-0">
          <EmptyState
            icon={Search}
            title="No matches"
            description={query ? `Nothing matches "${query}".` : "Nothing in this filter yet."}
          />
        </Card>
      )}

      <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        {!isLoading && sortedExpenses.length > 0 && group === "none" && (
          <div className="flex flex-col gap-3">{sortedExpenses.map((expense) => renderCard(expense))}</div>
        )}

        {!isLoading && sortedExpenses.length > 0 && group === "category" && (
          <div className="flex flex-col gap-5">
            {[...groupBy(sortedExpenses, (e) => e.categoryId).entries()]
              .sort(([a], [b]) => categoryName(a).localeCompare(categoryName(b)))
              .map(([categoryId, items]) => (
                <div key={categoryId} className="flex flex-col gap-3">
                  <h2 className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {categoryName(categoryId)} · {items.length}
                  </h2>
                  <div className="flex flex-col gap-3">{items.map((expense) => renderCard(expense))}</div>
                </div>
              ))}
          </div>
        )}
      </div>

      {!isLoading && archivedExpenses.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="flex items-center gap-2 px-1 text-sm font-medium text-muted-foreground">
            <Archive className="h-4 w-4" />
            Archived · {archivedExpenses.length}
          </h2>
          <div className="flex flex-col gap-3">
            {sortItems(archivedExpenses, "az", (e) => e.description, (e) => e.unitCost).map((expense) =>
              renderCard(expense, { archived: true })
            )}
          </div>
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
    </main>
  );
}
