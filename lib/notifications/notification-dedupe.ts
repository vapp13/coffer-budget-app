const STORAGE_PREFIX = "coffer-notified:";

/**
 * Tracks which notification "keys" have already been shown, in
 * localStorage — this is inherently best-effort (foreground-triggered, no
 * server), so a simple per-browser record is enough: it stops the same
 * condition from re-notifying every time the dashboard loads, without
 * needing a Firestore round-trip for something this low-stakes. Clearing
 * browser data or switching devices may cause a repeat notification for a
 * still-true condition — an acceptable tradeoff for a client-only feature.
 */
export function hasNotified(key: string): boolean {
  if (typeof window === "undefined") return true; // never fire during SSR
  try {
    return window.localStorage.getItem(STORAGE_PREFIX + key) === "1";
  } catch {
    return true; // localStorage unavailable (e.g. private browsing) — don't spam
  }
}

export function markNotified(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_PREFIX + key, "1");
  } catch {
    // Ignore — worst case this condition might notify again next time.
  }
}
