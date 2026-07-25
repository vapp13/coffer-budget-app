"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Wallet, Search, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/auth-context";
import { useIncomeSources } from "@/hooks/use-income-sources";
import { useFormatting } from "@/hooks/use-formatting";
import { useUndoableDelete } from "@/hooks/use-undoable-delete";
import { usePersistentState } from "@/hooks/use-persistent-state";
import { IncomeSourceForm } from "@/components/forms/income-source-form";
import { IncomeItem } from "@/components/income/income-item";
import { IncomeDetailsModal } from "@/components/income/income-details-modal";
import { IncomeStatusTabs, type IncomeStatusFilter } from "@/components/income/income-status-tabs";
import { IncomeSummaryCard } from "@/components/income/income-summary-card";
import { IncomeFilterSheet, type IncomeGroupOption } from "@/components/income/income-filter-sheet";
import { addDeduction } from "@/lib/data/deductions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ListRowSkeleton } from "@/components/ui/list-row-skeleton";
import { sortItems, type SortOption } from "@/lib/sort";
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
  const [statusFilter, setStatusFilter] = usePersistentState<IncomeStatusFilter>(
    "coffer-income-status-filter",
    "all"
  );
  const [sort, setSort] = usePersistentState<SortOption>("coffer-income-sort", "az");
  const [group, setGroup] = usePersistentState<IncomeGroupOption>("coffer-income-group", "none");

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

  async function handleDuplicate(income: IncomeSource) {
    try {
      await createIncomeSource.mutateAsync({
        label: `${income.label} (copy)`,
        source: income.source,
        sourceDetails: income.sourceDetails,
        grossYearlyAmount: income.grossYearlyAmount,
        effectiveFrom: income.effectiveFrom,
        effectiveTo: income.effectiveTo,
      });
      toast.success("Income source duplicated");
    } catch {
      toast.error("Couldn't duplicate that income source — try again.");
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

  function isActiveIncome(income: IncomeSource) {
    return !income.effectiveTo || income.effectiveTo >= new Date();
  }

  function matchesStatusFilter(income: IncomeSource) {
    if (statusFilter === "all") return true;
    return statusFilter === "active" ? isActiveIncome(income) : !isActiveIncome(income);
  }

  const visibleIncomeSources = (incomeSources ?? []).filter(
    (i) => !isPendingDelete(i.id) && matchesQuery(i) && matchesStatusFilter(i)
  );

  const sortedIncome = sortItems(visibleIncomeSources, sort, (i) => i.label, (i) => i.grossYearlyAmount);
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

  function renderCard(income: IncomeSource) {
    return (
      <IncomeItem
        key={income.id}
        income={income}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        onViewDetails={() => setViewingIncome(income)}
        onEdit={() => openEditModal(income)}
        onDuplicate={() => handleDuplicate(income)}
        onDelete={() => deleteWithUndo(income)}
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
        <h1 className="font-display text-2xl font-bold">Income</h1>
        <button
          type="button"
          onClick={openAddModal}
          aria-label="Add income source"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition active:scale-90"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      <IncomeStatusTabs value={statusFilter} onChange={setStatusFilter} />

      {!isLoading && hasAnyIncome && (
        <IncomeSummaryCard incomeSources={visibleIncomeSources} formatCurrency={formatCurrency} />
      )}

      {!isLoading && hasAnyIncome && (
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search income sources…"
              className="pl-9 pr-11"
              aria-label="Search income sources"
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
          <IncomeFilterSheet sort={sort} onSortChange={setSort} group={group} onGroupChange={setGroup} />
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="rounded-2xl p-0">
              <ListRowSkeleton />
            </Card>
          ))}
        </div>
      )}

      {!isLoading && !hasAnyIncome && (
        <Card className="rounded-2xl p-0">
          <EmptyState
            icon={Wallet}
            title="No income sources yet"
            description="Add your salary or other income to see your budget come together."
          />
        </Card>
      )}

      {!isLoading && hasAnyIncome && sortedIncome.length === 0 && (
        <Card className="rounded-2xl p-0">
          <EmptyState
            icon={Search}
            title="No matches"
            description={query ? `Nothing matches "${query}".` : "Nothing in this filter yet."}
          />
        </Card>
      )}

      {!isLoading && sortedIncome.length > 0 && group === "none" && (
        <div className="flex flex-col gap-3">{sortedIncome.map((income) => renderCard(income))}</div>
      )}

      {!isLoading && sortedIncome.length > 0 && group === "source" && (
        <div className="flex flex-col gap-5">
          {[...groupBy(sortedIncome, (i) => resolveIncomeSourceType(i)).entries()]
            .sort(([a], [b]) =>
              INCOME_SOURCE_TYPE_LABELS[a as IncomeSourceType].localeCompare(
                INCOME_SOURCE_TYPE_LABELS[b as IncomeSourceType]
              )
            )
            .map(([source, items]) => (
              <div key={source} className="flex flex-col gap-3">
                <h2 className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {INCOME_SOURCE_TYPE_LABELS[source as IncomeSourceType]} · {items.length}
                </h2>
                <div className="flex flex-col gap-3">{items.map((income) => renderCard(income))}</div>
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
