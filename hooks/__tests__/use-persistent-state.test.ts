import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { usePersistentState } from "@/hooks/use-persistent-state";

describe("usePersistentState", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("starts at the default value (matching what a static-export server render would show)", () => {
    const { result } = renderHook(() => usePersistentState("test-key", "none"));
    expect(result.current[0]).toBe("none");
  });

  it("restores a previously-stored value after mount", async () => {
    window.localStorage.setItem("test-key", JSON.stringify("category"));
    const { result } = renderHook(() => usePersistentState("test-key", "none"));

    await waitFor(() => {
      expect(result.current[0]).toBe("category");
    });
  });

  it("persists updates to localStorage under the given key", () => {
    const { result } = renderHook(() => usePersistentState("test-key", "none"));

    act(() => {
      result.current[1]("category");
    });

    expect(result.current[0]).toBe("category");
    expect(window.localStorage.getItem("test-key")).toBe(JSON.stringify("category"));
  });

  it("falls back to the default when the stored value is corrupt", () => {
    window.localStorage.setItem("test-key", "{not valid json");
    const { result } = renderHook(() => usePersistentState("test-key", "none"));
    expect(result.current[0]).toBe("none");
  });

  it("keeps independent keys from interfering with each other", () => {
    const { result: sortResult } = renderHook(() => usePersistentState("sort-key", "az"));
    const { result: groupResult } = renderHook(() => usePersistentState("group-key", "none"));

    act(() => {
      sortResult.current[1]("za");
    });

    expect(sortResult.current[0]).toBe("za");
    expect(groupResult.current[0]).toBe("none");
  });
});
