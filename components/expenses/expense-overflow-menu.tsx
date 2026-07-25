"use client";

import { Pencil, Copy, Trash2, Archive, ArchiveRestore } from "lucide-react";
import { OverflowMenu } from "@/components/ui/overflow-menu";

type ExpenseOverflowMenuProps = {
  isArchived?: boolean;
  onEdit: () => void;
  onDuplicate: () => void;
  onArchiveToggle: () => void;
  onDelete: () => void;
};

export function ExpenseOverflowMenu({
  isArchived = false,
  onEdit,
  onDuplicate,
  onArchiveToggle,
  onDelete,
}: ExpenseOverflowMenuProps) {
  return (
    <OverflowMenu
      items={[
        ...(!isArchived
          ? [
              { icon: Pencil, label: "Edit", onClick: onEdit },
              { icon: Copy, label: "Duplicate", onClick: onDuplicate },
            ]
          : []),
        {
          icon: isArchived ? ArchiveRestore : Archive,
          label: isArchived ? "Restore" : "Archive",
          onClick: onArchiveToggle,
        },
        { icon: Trash2, label: "Delete", onClick: onDelete, destructive: true },
      ]}
    />
  );
}
