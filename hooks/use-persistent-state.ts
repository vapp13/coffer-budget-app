"use client";

import { useEffect, useState } from "react";

/**
 * Like useState, but remembers the value in localStorage under `key` and
 * restores it on future visits. Deliberately does NOT read localStorage
 * during the initial render — this app statically prerenders at build time
 * (no `window`), so starting from `defaultValue` on both the server and the
 * client's first render avoids a hydration mismatch. The real stored value
 * (if any) is applied in an effect right after mount instead.
 */
export function usePersistentState<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(defaultValue);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored !== null) setValue(JSON.parse(stored) as T);
    } catch {
      // Corrupt value or storage unavailable (e.g. private browsing) — keep the default.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateValue(next: T) {
    setValue(next);
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // Ignore — worst case the preference just doesn't stick this time.
    }
  }

  return [value, updateValue];
}
