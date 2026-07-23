import { z } from "zod";

export const CURRENCY_OPTIONS = ["USD", "GBP", "EUR"] as const;
export const currencySchema = z.enum(CURRENCY_OPTIONS);
export type Currency = z.infer<typeof currencySchema>;

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: "$",
  GBP: "£",
  EUR: "€",
};

export const SUPPORTED_LOCALES = [
  { value: "en-GB", label: "English (UK) — dd/mm/yyyy" },
  { value: "en-US", label: "English (US) — mm/dd/yyyy" },
  { value: "en-IE", label: "English (Ireland) — dd/mm/yyyy" },
  { value: "de-DE", label: "German (Germany) — dd.mm.yyyy" },
  { value: "fr-FR", label: "French (France) — dd/mm/yyyy" },
] as const;

const localeValues = SUPPORTED_LOCALES.map((l) => l.value) as [string, ...string[]];
export const localeSchema = z.enum(localeValues);

export const themePreferenceSchema = z.enum(["dark", "light", "system"]);
export type ThemePreference = z.infer<typeof themePreferenceSchema>;

/** Full profile document as stored in Firestore (`users/{uid}`). */
export const userProfileSchema = z.object({
  displayName: z.string().trim().max(120).default(""),
  photoURL: z.string().trim().max(500).default(""),
  location: z.string().trim().max(60).default(""),
  currency: currencySchema.default("GBP"),
  locale: localeSchema.default("en-GB"),
  themePreference: themePreferenceSchema.default("dark"),
  // For pay cycles that don't align to the calendar month (e.g. paid on the
  // 25th) — not yet wired into the calculation engine, but stored now so it
  // doesn't require a data migration when it is.
  budgetCycleStartDay: z.coerce.number().int().min(1).max(28).default(1),
});

export type UserProfileInput = z.infer<typeof userProfileSchema>;
export type UserProfile = UserProfileInput & { id: string };

/**
 * The subset of the profile actually editable in Settings.
 * `displayName`/`photoURL` come from Google and aren't user-editable here,
 * so they're deliberately excluded — saving the form never touches them.
 */
export const userProfileFormSchema = userProfileSchema.pick({
  location: true,
  currency: true,
  locale: true,
  themePreference: true,
  budgetCycleStartDay: true,
});

export type UserProfileFormInput = z.infer<typeof userProfileFormSchema>;
