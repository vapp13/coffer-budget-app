"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Pencil, Trash2, RotateCcw, Tag } from "lucide-react";
import { toast } from "sonner";
import { useCategories } from "@/hooks/use-categories";
import { useUndoableDelete } from "@/hooks/use-undoable-delete";
import { groupBy } from "@/lib/group-by";
import { CategoryForm } from "@/components/categories/category-form";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ListRowSkeleton } from "@/components/ui/list-row-skeleton";
import type { Category, CategoryInput, CategoryGroup } from "@/lib/validation/category";

const GROUP_ORDER: CategoryGroup[] = ["House", "Personal", "Financial"];

export default function CategoriesPage() {
  const { data: categories, isLoading, createCategory, editCategory, removeCategory, restoreDefaults } =
    useCategories();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const { isPending: isPendingDelete, deleteWithUndo } = useUndoableDelete<Category>({
    onCommit: (category) => removeCategory.mutateAsync(category.id),
    getMessage: (category) => `Removed "${category.name}"`,
    getErrorMessage: (category) => `Couldn't remove "${category.name}" — try again.`,
  });

  function openAddModal() {
    setEditingCategory(null);
    setIsFormOpen(true);
  }

  function openEditModal(category: Category) {
    setEditingCategory(category);
    setIsFormOpen(true);
  }

  async function handleSubmit(input: CategoryInput) {
    try {
      if (editingCategory) {
        await editCategory.mutateAsync({ id: editingCategory.id, input });
        toast.success("Category updated");
      } else {
        await createCategory.mutateAsync(input);
        toast.success("Category added");
      }
      setIsFormOpen(false);
      setEditingCategory(null);
    } catch {
      toast.error(
        editingCategory ? "Couldn't update that category — try again." : "Couldn't add that category — try again."
      );
    }
  }

  async function handleRestoreDefaults() {
    setIsRestoring(true);
    try {
      const restoredCount = await restoreDefaults.mutateAsync();
      if (restoredCount === 0) {
        toast("You already have every default category.");
      } else {
        toast.success(`Restored ${restoredCount} default categor${restoredCount === 1 ? "y" : "ies"}`);
      }
    } catch {
      toast.error("Couldn't restore default categories — try again.");
    } finally {
      setIsRestoring(false);
    }
  }

  const visibleCategories = (categories ?? []).filter((c) => !isPendingDelete(c.id));
  const grouped = groupBy(visibleCategories, (c) => c.group);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <Link
        href="/settings"
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Settings
      </Link>

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-semibold">Categories</h1>
          <p className="text-sm text-muted-foreground">Organize how expenses are sorted.</p>
        </div>
        <Button onClick={openAddModal}>
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      {isLoading && (
        <Card className="p-0">
          <div className="divide-y divide-border">
            {Array.from({ length: 4 }).map((_, i) => (
              <ListRowSkeleton key={i} />
            ))}
          </div>
        </Card>
      )}

      {!isLoading && visibleCategories.length === 0 && (
        <Card className="p-0">
          <EmptyState
            icon={Tag}
            title="No categories yet"
            description="Add a category, or restore the defaults to get started."
            action={<Button onClick={openAddModal}>Add a category</Button>}
          />
        </Card>
      )}

      {!isLoading &&
        GROUP_ORDER.map((group) => {
          const items = grouped.get(group);
          if (!items || items.length === 0) return null;
          return (
            <div key={group} className="flex flex-col gap-2">
              <h2 className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {group}
              </h2>
              <Card className="p-0">
                <ul className="divide-y divide-border">
                  {items.map((category) => (
                    <li key={category.id} className="flex items-center gap-3 px-4 py-3">
                      <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{category.name}</p>
                        {category.monthlyBudget && (
                          <p className="text-xs text-muted-foreground">
                            Budget: {category.monthlyBudget}/mo
                          </p>
                        )}
                      </div>
                      {category.isDefault && (
                        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          Default
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        onClick={() => openEditModal(category)}
                        aria-label={`Edit ${category.name}`}
                        className="shrink-0 px-2"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => deleteWithUndo(category)}
                        aria-label={`Remove ${category.name}`}
                        className="shrink-0 px-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          );
        })}

      <Button variant="outline" onClick={handleRestoreDefaults} disabled={isRestoring}>
        <RotateCcw className="h-4 w-4" />
        {isRestoring ? "Restoring…" : "Restore default categories"}
      </Button>
      <p className="-mt-4 text-xs text-muted-foreground">
        Adds back any default category you've deleted or don't have yet — won't duplicate ones you
        already have.
      </p>

      <Dialog
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingCategory(null);
        }}
        title={editingCategory ? "Edit category" : "Add a category"}
      >
        <CategoryForm
          defaultValues={editingCategory ?? undefined}
          onSubmit={handleSubmit}
          isSubmitting={createCategory.isPending || editCategory.isPending}
          submitLabel={editingCategory ? "Save changes" : "Add category"}
        />
      </Dialog>
    </main>
  );
}
