"use client";

import { useState, type ReactNode } from "react";
import { Info } from "lucide-react";

type InfoTooltipProps = {
  title?: string;
  children: ReactNode;
};

export function InfoTooltip({ title, children }: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        aria-label={title ?? "More information"}
        className="flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition hover:text-foreground"
      >
        <Info className="h-3.5 w-3.5" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-1/2 top-full z-50 mt-2 w-64 -translate-x-1/2 rounded-lg border border-border bg-surface p-3 text-xs leading-relaxed text-muted-foreground shadow-lg">
            {title && <p className="mb-1 text-sm font-medium text-foreground">{title}</p>}
            {children}
          </div>
        </>
      )}
    </span>
  );
}
