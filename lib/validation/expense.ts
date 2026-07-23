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

export const expenseSchema = z
  .object({
    description: z.string().trim().min(1, "Description is required").max(120),
    categoryId: z.string().min(1, "Category is required"),
    unitCost: z.coerce.number().positive("Cost must be greater than 0"),
    frequency: frequencySchema,
    startDate: optionalDate,
    endDate: optionalDate,
    isActive: z.boolean().default(true),
    notes: z.string().trim().max(500).optional(),
  })
  .refine(
    (data) => !data.startDate || !data.endDate || data.endDate >= data.startDate,
    { message: "End date must be after start date", path: ["endDate"] }
  );

export type ExpenseInput = z.infer<typeof expenseSchema>;

export type Expense = ExpenseInput & {
  id: string;
  createdAt?: Date;
};
