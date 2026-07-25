"use client";

import { Pencil, Copy, Trash2 } from "lucide-react";
import { OverflowMenu } from "@/components/ui/overflow-menu";

type IncomeOverflowMenuProps = {
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
};

export function IncomeOverflowMenu({ onEdit, onDuplicate, onDelete }: IncomeOverflowMenuProps) {
  return (
    <OverflowMenu
      items={[
        { icon: Pencil, label: "Edit", onClick: onEdit },
        { icon: Copy, label: "Duplicate", onClick: onDuplicate },
        { icon: Trash2, label: "Delete", onClick: onDelete, destructive: true },
      ]}
    />
  );
}
