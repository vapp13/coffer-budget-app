import { z } from "zod";

export const taxProfileSchema = z.object({
  taxYear: z.string().trim().min(1, "Tax year is required"), // e.g. "2026/27"
  personalAllowance: z.coerce.number().nonnegative(),
  niThresholdAnnual: z.coerce.number().nonnegative(),
  niRate: z.coerce.number().min(0).max(1),
  pensionRate: z.coerce.number().min(0).max(1),
  payeBasicRate: z.coerce.number().min(0).max(1),
  payeHigherRate: z.coerce.number().min(0).max(1),
  payeAdditionalRate: z.coerce.number().min(0).max(1),
  payeBasicMin: z.coerce.number().nonnegative(),
  payeBasicMax: z.coerce.number().nonnegative(),
  payeHigherMin: z.coerce.number().nonnegative(),
  payeHigherMax: z.coerce.number().nonnegative(),
  additionalRateOver: z.coerce.number().nonnegative(),
  effectiveFrom: z.coerce.date(),
});

export type TaxProfileInput = z.infer<typeof taxProfileSchema>;

export type TaxProfile = TaxProfileInput & {
  id: string;
};

/** Mirrors the constants already in the source spreadsheet (rows 51–62). */
export const DEFAULT_TAX_PROFILE: TaxProfileInput = {
  taxYear: "2026/27",
  personalAllowance: 12570,
  niThresholdAnnual: 12570,
  niRate: 0.08,
  pensionRate: 0.098,
  payeBasicRate: 0.2,
  payeHigherRate: 0.4,
  payeAdditionalRate: 0.45,
  payeBasicMin: 12571,
  payeBasicMax: 50270,
  payeHigherMin: 50271,
  payeHigherMax: 125140,
  additionalRateOver: 125140,
  effectiveFrom: new Date("2026-04-06"),
};
