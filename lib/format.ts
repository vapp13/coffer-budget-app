/**
 * Formatting defaults, used until a user's profile has loaded (or for a
 * signed-out user). Once loaded, callers should pass the user's actual
 * `locale`/`currency` from their profile — see `hooks/use-formatting.ts`
 * for the bound convenience version most components should reach for.
 */
export const DEFAULT_LOCALE = "en-GB";
export const DEFAULT_CURRENCY = "GBP";

export function formatDate(
  date: Date | undefined | null,
  locale: string = DEFAULT_LOCALE
): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatCurrency(
  amount: number,
  locale: string = DEFAULT_LOCALE,
  currency: string = DEFAULT_CURRENCY
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount);
}
