import { z } from "zod";
import { optionalDate } from "@/lib/validation/date-helpers";

export const GOAL_TYPES = [
  "emergency_fund",
  "house_deposit",
  "holiday",
  "retirement",
  "investment_portfolio",
  "custom",
] as const;

export const goalTypeSchema = z.enum(GOAL_TYPES);
export type GoalType = z.infer<typeof goalTypeSchema>;

export const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  emergency_fund: "Emergency Fund",
  house_deposit: "House Deposit",
  holiday: "Holiday",
  retirement: "Retirement",
  investment_portfolio: "Investment Portfolio",
  custom: "Custom Goal",
};

export const GOAL_TYPE_OPTIONS = GOAL_TYPES.map((value) => ({
  value,
  label: GOAL_TYPE_LABELS[value],
}));

export const goalSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  type: goalTypeSchema,
  targetAmount: z.coerce.number().positive("Target must be greater than 0"),
  currentAmount: z.coerce.number().min(0).default(0),
  targetDate: optionalDate,
  /** Optional reference to a Savings/Investment category — stored now for a
   * future milestone to auto-track progress from actual spending; progress
   * is manually updated by the user for the time being. */
  linkedCategoryId: z.string().optional(),
});

export type GoalInput = z.infer<typeof goalSchema>;

export type Goal = GoalInput & {
  id: string;
};
