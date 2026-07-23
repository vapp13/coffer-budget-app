import { z } from "zod";
import { optionalDate } from "@/lib/validation/date-helpers";

export const frequencySchema = z.enum([
  "daily",
  "weekly",
  "fortnightly",
  "monthly",
  "quarterly",
  "yearly",
]);
export type Frequency = z.infer<typeof frequencySchema>;

// Multiplier to normalize a unit cost to a yearly total.
export const FREQUENCY_TO_YEARLY_MULTIPLIER: Record<Frequency, number> = {
  daily: 365,
  weekly: 52,
  fortnightly: 26,
  monthly: 12,
  quarterly: 4,
  yearly: 1,
};

export const expenseTypeSchema = z.enum(["recurring", "one_time"]);
export type ExpenseType = z.infer<typeof expenseTypeSchema>;

export const EXPENSE_TYPE_LABELS: Record<ExpenseType, string> = {
  recurring: "Recurring",
  one_time: "One-time",
};

export const expenseSchema = z
  .object({
    description: z.string().trim().min(1, "Description is required").max(120),
    categoryId: z.string().min(1, "Category is required"),
    unitCost: z.coerce.number().positive("Cost must be greater than 0"),
    frequency: frequencySchema,
    /** Defaults to "recurring" so existing records (which predate this
     * field) behave exactly as they always have — see resolveExpenseType. */
    expenseType: expenseTypeSchema.default("recurring"),
    startDate: optionalDate,
    endDate: optionalDate,
    /** Doubles as the archive flag: false means archived, not merely "inactive". */
    isActive: z.boolean().default(true),
    notes: z.string().trim().max(500).optional(),
  })
  .refine(
    (data) => !data.startDate || !data.endDate || data.endDate >= data.startDate,
    { message: "End date must be after start date", path: ["endDate"] }
  )
  .refine((data) => data.expenseType !== "one_time" || !!data.startDate, {
    message: "A date is required for one-time expenses",
    path: ["startDate"],
  });

export type ExpenseInput = z.infer<typeof expenseSchema>;

export type Expense = ExpenseInput & {
  id: string;
  createdAt?: Date;
};

/**
 * Expenses created before `expenseType` existed won't have it set in
 * Firestore, even though the schema says it's required — reads aren't
 * validated through the schema, just cast. Treating them as "recurring" is
 * the correct legacy behavior: that's what every expense implicitly was
 * before this field existed.
 */
export function resolveExpenseType(expense: Expense): ExpenseType {
  return expense.expenseType ?? "recurring";
}
