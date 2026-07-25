import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { toast } from "sonner";
import { useUndoableDelete } from "@/hooks/use-undoable-delete";

vi.mock("sonner", () => ({
  toast: Object.assign(
    vi.fn(),
    { error: vi.fn(), success: vi.fn() }
  ),
}));

type Item = { id: string; name: string };

function getUndoAction() {
  const call = vi.mocked(toast).mock.calls.at(-1);
  return call?.[1]?.action as { label: string; onClick: () => void } | undefined;
}

describe("useUndoableDelete", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(toast).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("hides the item immediately, but doesn't commit until the delay passes", async () => {
    const onCommit = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useUndoableDelete<Item>({ onCommit, getMessage: (item) => `Removed ${item.name}` })
    );

    const item = { id: "1", name: "Netflix" };

    act(() => {
      result.current.deleteWithUndo(item);
    });

    expect(result.current.isPending("1")).toBe(true);
    expect(onCommit).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    expect(onCommit).toHaveBeenCalledWith(item);
    expect(result.current.isPending("1")).toBe(false);
  });

  it("clicking Undo cancels the pending delete — onCommit is never called", async () => {
    const onCommit = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useUndoableDelete<Item>({ onCommit, getMessage: (item) => `Removed ${item.name}` })
    );

    act(() => {
      result.current.deleteWithUndo({ id: "1", name: "Netflix" });
    });

    expect(result.current.isPending("1")).toBe(true);

    const undoAction = getUndoAction();
    expect(undoAction?.label).toBe("Undo");

    act(() => {
      undoAction?.onClick();
    });

    expect(result.current.isPending("1")).toBe(false);

    // Even after the original delay would have elapsed, nothing should fire.
    await act(async () => {
      vi.advanceTimersByTime(10000);
    });
    expect(onCommit).not.toHaveBeenCalled();
  });

  it("shows an error toast if the commit fails once the delay passes", async () => {
    const onCommit = vi.fn().mockRejectedValue(new Error("permission-denied"));
    const getErrorMessage = vi.fn().mockReturnValue("Couldn't remove that — try again.");
    const { result } = renderHook(() =>
      useUndoableDelete<Item>({
        onCommit,
        getMessage: (item) => `Removed ${item.name}`,
        getErrorMessage,
      })
    );

    act(() => {
      result.current.deleteWithUndo({ id: "1", name: "Netflix" });
    });

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    expect(toast.error).toHaveBeenCalledWith("Couldn't remove that — try again.");
    // The item is no longer "pending" (the attempt is over), even though it failed.
    expect(result.current.isPending("1")).toBe(false);
  });

  it("supports a custom delay", async () => {
    const onCommit = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useUndoableDelete<Item>({
        onCommit,
        getMessage: (item) => `Removed ${item.name}`,
        delayMs: 1000,
      })
    );

    act(() => {
      result.current.deleteWithUndo({ id: "1", name: "Netflix" });
    });

    await act(async () => {
      vi.advanceTimersByTime(999);
    });
    expect(onCommit).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(1);
    });
    expect(onCommit).toHaveBeenCalledOnce();
  });

  it("flushes any still-pending delete on unmount, honoring the original intent rather than silently cancelling it", async () => {
    const onCommit = vi.fn().mockResolvedValue(undefined);
    const { result, unmount } = renderHook(() =>
      useUndoableDelete<Item>({ onCommit, getMessage: (item) => `Removed ${item.name}` })
    );

    act(() => {
      result.current.deleteWithUndo({ id: "1", name: "Netflix" });
    });

    expect(onCommit).not.toHaveBeenCalled();

    unmount();

    // The flush is fire-and-forget (not awaited by the cleanup itself), but
    // it should have been called synchronously as part of unmounting.
    expect(onCommit).toHaveBeenCalledWith({ id: "1", name: "Netflix" });
  });

  it("tracks multiple pending deletes independently", async () => {
    const onCommit = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useUndoableDelete<Item>({ onCommit, getMessage: (item) => `Removed ${item.name}` })
    );

    act(() => {
      result.current.deleteWithUndo({ id: "1", name: "Netflix" });
      result.current.deleteWithUndo({ id: "2", name: "Spotify" });
    });

    expect(result.current.isPending("1")).toBe(true);
    expect(result.current.isPending("2")).toBe(true);

    const undoAction = getUndoAction(); // undoes the most recent (id "2")
    act(() => {
      undoAction?.onClick();
    });

    expect(result.current.isPending("1")).toBe(true);
    expect(result.current.isPending("2")).toBe(false);

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith({ id: "1", name: "Netflix" });
  });
});
