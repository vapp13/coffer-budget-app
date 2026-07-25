"use client";

import { useState, type MouseEvent, type ComponentType } from "react";
import { MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";

export type OverflowMenuItem = {
  icon: ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  destructive?: boolean;
};

type OverflowMenuProps = {
  items: OverflowMenuItem[];
  /** Defaults to "More actions" — override for a more specific label if useful. */
  label?: string;
};

export function OverflowMenu({ items, label = "More actions" }: OverflowMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  function stop(event: MouseEvent) {
    event.stopPropagation();
  }

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={(event) => {
          stop(event);
          setIsOpen((open) => !open);
        }}
        aria-label={label}
        aria-expanded={isOpen}
        className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted active:scale-90"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={(event) => {
              stop(event);
              setIsOpen(false);
            }}
          />
          <div className="animate-overlay-in absolute right-0 z-50 mt-1 w-40 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-lg">
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={(event) => {
                  stop(event);
                  setIsOpen(false);
                  item.onClick();
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition hover:bg-muted",
                  item.destructive ? "text-negative" : "text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
