"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Dialog({ open, onClose, title, children }: DialogProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // Focus trap + Escape-to-close + focus restore. Without this, keyboard
  // and screen-reader users can Tab straight through the dialog into
  // content hidden behind the overlay, and focus is simply abandoned
  // (reset to <body>) once the dialog closes instead of returning to
  // whatever triggered it.
  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement;
    const container = containerRef.current;
    // Skip the close button for *initial* focus specifically — it's first
    // in DOM order (it's in the header, before children), but landing a
    // keyboard user there first is worse UX than landing on the actual
    // content. The Tab trap below still treats it as part of the loop.
    const focusable = container
      ? Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
      : [];
    const firstContentFocusable = focusable.find((el) => !el.hasAttribute("data-dialog-close"));
    (firstContentFocusable ?? container)?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !container) return;

      const focusable = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusable.length === 0) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="animate-overlay-in fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:px-4"
      onClick={onClose}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="animate-sheet-in sm:animate-modal-in max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-border bg-surface p-6 shadow-lg sm:rounded-lg focus:outline-none"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Swipe-sheet affordance — mobile only */}
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-muted sm:hidden" />

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold">{title}</h2>
          <button
            type="button"
            data-dialog-close
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
