"use client";

import { useUserProfile } from "@/hooks/use-user-profile";
import {
  formatDate as formatDateRaw,
  formatCurrency as formatCurrencyRaw,
  DEFAULT_LOCALE,
  DEFAULT_CURRENCY,
} from "@/lib/format";

/**
 * Returns formatDate/formatCurrency already bound to the signed-in user's
 * locale/currency preferences, falling back to UK defaults while the
 * profile is still loading or for a signed-out user.
 */
export function useFormatting() {
  const { data: profile } = useUserProfile();
  const locale = profile?.locale ?? DEFAULT_LOCALE;
  const currency = profile?.currency ?? DEFAULT_CURRENCY;

  return {
    locale,
    currency,
    formatDate: (date: Date | undefined | null) => formatDateRaw(date, locale),
    formatCurrency: (amount: number) => formatCurrencyRaw(amount, locale, currency),
  };
}
