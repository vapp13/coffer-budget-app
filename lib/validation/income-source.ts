import { z } from "zod";
import { optionalDate, requiredDate } from "@/lib/validation/date-helpers";

export const INCOME_SOURCE_TYPES = [
  "main_job",
  "secondary_job",
  "self_employed",
  "business",
  "freelance",
  "side_hustle",
  "investments",
  "rental_income",
  "pension",
  "benefits",
  "gifts",
  "other",
] as const;

export const incomeSourceTypeSchema = z.enum(INCOME_SOURCE_TYPES);
export type IncomeSourceType = z.infer<typeof incomeSourceTypeSchema>;

export const INCOME_SOURCE_TYPE_LABELS: Record<IncomeSourceType, string> = {
  main_job: "Main Job",
  secondary_job: "Secondary Job",
  self_employed: "Self-employed",
  business: "Business",
  freelance: "Freelance",
  side_hustle: "Side Hustle",
  investments: "Investments",
  rental_income: "Rental Income",
  pension: "Pension",
  benefits: "Benefits",
  gifts: "Gifts",
  other: "Other",
};

export const INCOME_SOURCE_TYPE_OPTIONS = INCOME_SOURCE_TYPES.map((value) => ({
  value,
  label: INCOME_SOURCE_TYPE_LABELS[value],
}));

export const incomeSourceSchema = z
  .object({
    label: z.string().trim().min(1, "Label is required").max(120),
    source: incomeSourceTypeSchema.default("other"),
    sourceDetails: z.string().trim().max(200).optional(),
    grossYearlyAmount: z.coerce.number().positive("Amount must be greater than 0"),
    effectiveFrom: requiredDate("Effective from date is required"),
    effectiveTo: optionalDate,
  })
  .refine(
    (data) => !data.effectiveTo || data.effectiveTo >= data.effectiveFrom,
    { message: "End date must be after start date", path: ["effectiveTo"] }
  );

export type IncomeSourceInput = z.infer<typeof incomeSourceSchema>;

export type IncomeSource = IncomeSourceInput & {
  id: string;
};

/**
 * Records created before the Source field existed won't have it set in
 * Firestore, even though the type says it's required — reads aren't
 * validated through the schema, just cast. This gives every call site a
 * safe fallback without needing a data migration.
 */
export function resolveIncomeSourceType(income: IncomeSource): IncomeSourceType {
  return income.source ?? "other";
}

/** Case-insensitive match against the human-readable label, for CSV import. */
export function parseIncomeSourceType(raw: string): IncomeSourceType {
  const normalized = raw.trim().toLowerCase();
  const match = INCOME_SOURCE_TYPE_OPTIONS.find(
    (option) => option.label.toLowerCase() === normalized || option.value === normalized
  );
  return match ? match.value : "other";
}
