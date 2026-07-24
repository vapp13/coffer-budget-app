"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Wallet, ArrowUpDown, LayoutGrid, Search, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/auth-context";
import { useIncomeSources } from "@/hooks/use-income-sources";
import { useFormatting } from "@/hooks/use-formatting";
import { useUndoableDelete } from "@/hooks/use-undoable-delete";
import { IncomeSourceForm } from "@/components/forms/income-source-form";
import { IncomeItem } from "@/components/income/income-item";
import { IncomeDetailsModal } from "@/components/income/income-details-modal";
import { addDeduction } from "@/lib/data/deductions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ListRowSkeleton } from "@/components/ui/list-row-skeleton";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { SORT_OPTIONS, sortItems, type SortOption } from "@/lib/sort";
import { groupBy } from "@/lib/group-by";
import { toDateInputValue } from "@/lib/date-input-value";
import type { DeductionInput } from "@/lib/validation/deduction";
import {
  INCOME_SOURCE_TYPE_LABELS,
  resolveIncomeSourceType,
  type IncomeSource,
  type IncomeSourceInput,
  type IncomeSourceType,
} from "@/lib/validation/income-source";

type ViewOption = "list" | "card" | "group";
const VIEW_OPTIONS: { value: ViewOption; label: string }[] = [
  { value: "list", label: "List view" },
  { value: "card", label: "Card view" },
  { value: "group", label: "Group by source" },
];

export default function IncomePage() {
  const { user } = useAuth();
  const {
    data: incomeSources,
    isLoading,
    createIncomeSource,
    editIncomeSource,
    removeIncomeSource,
  } = useIncomeSources();
  const { formatDate, formatCurrency } = useFormatting();

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortOption>("az");
  const [view, setView] = useState<ViewOption>("list");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<IncomeSource | null>(null);
  const [viewingIncome, setViewingIncome] = useState<IncomeSource | null>(null);

  const { isPending: isPendingDelete, deleteWithUndo } = useUndoableDelete<IncomeSource>({
    onCommit: (income) => removeIncomeSource.mutateAsync(income.id),
    getMessage: (income) => `Removed "${income.label}"`,
    getErrorMessage: (income) => `Couldn't remove "${income.label}" — try again.`,
  });

  function openAddModal() {
    setEditingIncome(null);
    setIsFormOpen(true);
  }

  function openEditModal(income: IncomeSource) {
    setEditingIncome(income);
    setIsFormOpen(true);
  }

  async function handleFormSubmit(input: IncomeSourceInput, draftDeductions: DeductionInput[]) {
    try {
      if (editingIncome) {
        await editIncomeSource.mutateAsync({ id: editingIncome.id, input });
        toast.success("Income source updated");
      } else {
        const newId = await createIncomeSource.mutateAsync(input);
        toast.success("Income source added");

        if (draftDeductions.length > 0 && user) {
          try {
            for (const draft of draftDeductions) {
              await addDeduction(user.uid, newId, draft);
            }
          } catch (error) {
            // The income source itself was created successfully — only the
            // deductions failed, so this needs its own message rather than
            // being reported (misleadingly) as the income source failing.
            console.error("Failed to save deductions for new income source:", error);
            const code = (error as { code?: string })?.code;
            toast.error(
              code === "permission-denied"
                ? "Income source saved, but deductions couldn't be added — your Firestore security rules may need updating."
                : "Income source saved, but one or more deductions couldn't be added — try adding them again by editing this income source."
            );
          }
        }
      }
      setIsFormOpen(false);
      setEditingIncome(null);
    } catch (error) {
      console.error("Failed to save income source:", error);
      toast.error(
        editingIncome ? "Couldn't update that income source — try again." : "Couldn't add that income source — try again."
      );
    }
  }

  function matchesQuery(income: IncomeSource) {
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    return (
      income.label.toLowerCase().includes(q) ||
      (income.sourceDetails ?? "").toLowerCase().includes(q) ||
      INCOME_SOURCE_TYPE_LABELS[resolveIncomeSourceType(income)].toLowerCase().includes(q)
    );
  }

  const visibleIncomeSources = (incomeSources ?? []).filter(
    (i) => !isPendingDelete(i.id) && matchesQuery(i)
  );

  const sortedIncome = sortItems(
    visibleIncomeSources,
    sort,
    (i) => i.label,
    (i) => i.grossYearlyAmount
  );

  const hasAnyIncome = (incomeSources ?? []).length > 0;

  const editDefaultValues = editingIncome
    ? {
        label: editingIncome.label,
        source: editingIncome.source,
        sourceDetails: editingIncome.sourceDetails,
        grossYearlyAmount: editingIncome.grossYearlyAmount,
        effectiveFrom: toDateInputValue(editingIncome.effectiveFrom),
        effectiveTo: toDateInputValue(editingIncome.effectiveTo),
      }
    : undefined;

  function renderList(items: IncomeSource[]) {
    return (
      <ul className="divide-y divide-border">
        {items.map((income) => (
          <IncomeItem
            key={income.id}
            income={income}
            formatCurrency={formatCurrency}
            variant="list"
            onViewDetails={() => setViewingIncome(income)}
            onEdit={() => openEditModal(income)}
            onDelete={() => deleteWithUndo(income)}
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
          <h1 className="font-display text-xl font-semibold">Income</h1>
          <p className="text-sm text-muted-foreground">Gross yearly income sources.</p>
        </div>
        <Button onClick={openAddModal}>
          <Plus className="h-4 w-4" />
          Add Income
        </Button>
      </div>

      {!isLoading && hasAnyIncome && (
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search income sources…"
              className="pl-9 pr-9"
              aria-label="Search income sources"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

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
        </div>
      )}

      {isLoading && (
        <Card className="p-0">
          <div className="divide-y divide-border">
            {Array.from({ length: 2 }).map((_, i) => (
              <ListRowSkeleton key={i} />
            ))}
          </div>
        </Card>
      )}

      {!isLoading && !hasAnyIncome && (
        <Card className="p-0">
          <EmptyState
            icon={Wallet}
            title="No income sources yet"
            description="Add your salary or other income to see your budget come together."
            action={<Button onClick={openAddModal}>Add income source</Button>}
          />
        </Card>
      )}

      {!isLoading && hasAnyIncome && sortedIncome.length === 0 && query && (
        <Card className="p-0">
          <EmptyState icon={Search} title="No matches" description={`Nothing matches "${query}".`} />
        </Card>
      )}

      {!isLoading && sortedIncome.length > 0 && view === "list" && (
        <Card className="p-0">{renderList(sortedIncome)}</Card>
      )}

      {!isLoading && sortedIncome.length > 0 && view === "card" && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {sortedIncome.map((income) => (
            <IncomeItem
              key={income.id}
              income={income}
              formatCurrency={formatCurrency}
              variant="card"
              onViewDetails={() => setViewingIncome(income)}
              onEdit={() => openEditModal(income)}
              onDelete={() => deleteWithUndo(income)}
            />
          ))}
        </div>
      )}

      {!isLoading && sortedIncome.length > 0 && view === "group" && (
        <div className="flex flex-col gap-5">
          {[...groupBy(sortedIncome, (i) => resolveIncomeSourceType(i)).entries()]
            .sort(([a], [b]) =>
              INCOME_SOURCE_TYPE_LABELS[a as IncomeSourceType].localeCompare(
                INCOME_SOURCE_TYPE_LABELS[b as IncomeSourceType]
              )
            )
            .map(([source, items]) => (
              <div key={source} className="flex flex-col gap-2">
                <h2 className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {INCOME_SOURCE_TYPE_LABELS[source as IncomeSourceType]} · {items.length}
                </h2>
                <Card className="p-0">{renderList(items)}</Card>
              </div>
            ))}
        </div>
      )}

      <Dialog
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingIncome(null);
        }}
        title={editingIncome ? "Edit income source" : "Add an income source"}
      >
        <IncomeSourceForm
          incomeSourceId={editingIncome?.id}
          defaultValues={editDefaultValues}
          onSubmit={handleFormSubmit}
          isSubmitting={createIncomeSource.isPending || editIncomeSource.isPending}
          submitLabel={editingIncome ? "Save changes" : "Add income source"}
        />
      </Dialog>

      <IncomeDetailsModal
        income={viewingIncome}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        onClose={() => setViewingIncome(null)}
      />
    </main>
  );
}
