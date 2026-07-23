import { z } from "zod";

export const categoryGroupSchema = z.enum(["House", "Personal", "Financial"]);
export type CategoryGroup = z.infer<typeof categoryGroupSchema>;

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60),
  group: categoryGroupSchema,
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a hex value like #4C6FFF"),
  isDefault: z.boolean().default(false),
  /** Optional per-category monthly spending limit, for budget tracking. No limit if unset. */
  monthlyBudget: z.coerce.number().positive().optional(),
});

export type CategoryInput = z.infer<typeof categorySchema>;

export type Category = CategoryInput & {
  id: string;
};

// Seeded once per new user — mirrors the categories already in the spreadsheet.
export const DEFAULT_CATEGORIES: CategoryInput[] = [
  { name: "Mortgage", group: "House", color: "#2BAE85", isDefault: true },
  { name: "Maintenance", group: "House", color: "#4FA8C9", isDefault: true },
  { name: "Utilities", group: "House", color: "#5B8DEF", isDefault: true },
  { name: "Food", group: "Personal", color: "#D9B36C", isDefault: true },
  { name: "Transport", group: "Personal", color: "#E8896B", isDefault: true },
  { name: "Subscriptions", group: "Personal", color: "#9B7FE8", isDefault: true },
  { name: "Personal Spending", group: "Personal", color: "#E8748F", isDefault: true },
  { name: "Credit", group: "Financial", color: "#D98A4C", isDefault: true },
  { name: "Investment", group: "Financial", color: "#C9A227", isDefault: true },
  { name: "Savings", group: "Financial", color: "#1F8F6B", isDefault: true },
  { name: "Other", group: "Personal", color: "#8A9199", isDefault: true },
];
