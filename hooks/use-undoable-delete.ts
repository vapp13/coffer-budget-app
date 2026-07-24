"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const DEFAULT_DELAY_MS = 5000;

type UseUndoableDeleteOptions<T> = {
  /** Called only once the undo window has passed without the user undoing. */
  onCommit: (item: T) => Promise<unknown>;
  /** Text for the toast, e.g. `Removed "Netflix"`. */
  getMessage: (item: T) => string;
  /** Shown if the actual commit fails after the window passes. Receives the
   * thrown error too, so callers can special-case things like permission errors. */
  getErrorMessage?: (item: T, error: unknown) => string;
  delayMs?: number;
};

/**
 * A "soft delete" pattern: the item disappears from the UI immediately
 * (via `isPending`), but the real deletion is delayed — if the user clicks
 * "Undo" on the toast within the window, nothing was ever actually removed.
 * Only commits for real once the timer elapses. Safer than optimistically
 * deleting-then-recreating on undo, which risks losing relational data
 * (e.g. an income source's deductions subcollection) tied to the old id.
 */
export function useUndoableDelete<T extends { id: string }>({
  onCommit,
  getMessage,
  getErrorMessage,
  delayMs = DEFAULT_DELAY_MS,
}: UseUndoableDeleteOptions<T>) {
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const items = useRef<Map<string, T>>(new Map());

  // Keep a ref to the latest callbacks so the unmount-cleanup effect below
  // (which only ever runs once, on unmount) doesn't call a stale closure
  // from whatever render first mounted this hook.
  const latestOnCommit = useRef(onCommit);
  latestOnCommit.current = onCommit;

  // If the user navigates away mid-window, honor their original intent to
  // delete rather than silently cancelling it — flush any still-pending
  // deletions immediately instead of leaving them stuck forever.
  useEffect(() => {
    return () => {
      timers.current.forEach((timer, id) => {
        clearTimeout(timer);
        const item = items.current.get(id);
        if (item) latestOnCommit.current(item).catch(() => {});
      });
    };
  }, []);

  function isPending(id: string) {
    return pendingIds.has(id);
  }

  function deleteWithUndo(item: T) {
    setPendingIds((prev) => new Set(prev).add(item.id));
    items.current.set(item.id, item);

    const timer = setTimeout(async () => {
      timers.current.delete(item.id);
      items.current.delete(item.id);
      try {
        await onCommit(item);
      } catch (error) {
        toast.error(
          getErrorMessage
            ? getErrorMessage(item, error)
            : "Couldn't complete that removal — try again."
        );
      }
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }, delayMs);
    timers.current.set(item.id, timer);

    toast(getMessage(item), {
      duration: delayMs,
      action: {
        label: "Undo",
        onClick: () => {
          const pendingTimer = timers.current.get(item.id);
          if (pendingTimer) clearTimeout(pendingTimer);
          timers.current.delete(item.id);
          items.current.delete(item.id);
          setPendingIds((prev) => {
            const next = new Set(prev);
            next.delete(item.id);
            return next;
          });
        },
      },
    });
  }

  return { isPending, deleteWithUndo };
}
