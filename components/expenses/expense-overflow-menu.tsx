"use client";

import { useState, type MouseEvent } from "react";
import { MoreVertical, Pencil, Copy, Trash2, Archive, ArchiveRestore } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [isOpen, setIsOpen] = useState(false);

  function stop(event: MouseEvent) {
    event.stopPropagation();
  }

  function runAndClose(action: () => void) {
    return (event: MouseEvent) => {
      stop(event);
      setIsOpen(false);
      action();
    };
  }

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={(event) => {
          stop(event);
          setIsOpen((open) => !open);
        }}
        aria-label="More actions"
        aria-expanded={isOpen}
        className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted active:scale-90"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={runAndClose(() => {})} />
          <div className="animate-overlay-in absolute right-0 z-50 mt-1 w-40 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-lg">
            {!isArchived && <MenuItem icon={Pencil} label="Edit" onClick={runAndClose(onEdit)} />}
            {!isArchived && <MenuItem icon={Copy} label="Duplicate" onClick={runAndClose(onDuplicate)} />}
            <MenuItem
              icon={isArchived ? ArchiveRestore : Archive}
              label={isArchived ? "Restore" : "Archive"}
              onClick={runAndClose(onArchiveToggle)}
            />
            <MenuItem icon={Trash2} label="Delete" onClick={runAndClose(onDelete)} destructive />
          </div>
        </>
      )}
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  destructive = false,
}: {
  icon: typeof Pencil;
  label: string;
  onClick: (event: MouseEvent) => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition hover:bg-muted",
        destructive ? "text-negative" : "text-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
