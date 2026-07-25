import { z } from "zod";

/**
 * HTML number inputs send "" when cleared, not undefined. `z.coerce.number()`
 * turns "" into 0 (via `Number("")`), which then fails `.positive()` even on
 * an `.optional()` field — so a genuinely empty field gets rejected as if
 * the user had typed 0. This normalizes "" (and null) to undefined first,
 * so optional number fields are truly optional. Mirrors `optionalDate` in
 * date-helpers.ts, which solves the identical problem for date inputs.
 */
export function optionalPositiveNumber(message?: string) {
  return z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().positive(message).optional()
  );
}
