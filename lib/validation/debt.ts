import { z } from "zod";
import { optionalDate } from "@/lib/validation/date-helpers";
import { optionalPositiveNumber } from "@/lib/validation/number-helpers";

export const DEBT_TYPES = ["credit_card", "loan", "mortgage", "student_loan", "other"] as const;

export const debtTypeSchema = z.enum(DEBT_TYPES);
export type DebtType = z.infer<typeof debtTypeSchema>;

export const DEBT_TYPE_LABELS: Record<DebtType, string> = {
  credit_card: "Credit Card",
  loan: "Loan",
  mortgage: "Mortgage",
  student_loan: "Student Loan",
  other: "Other",
};

export const DEBT_TYPE_OPTIONS = DEBT_TYPES.map((value) => ({
  value,
  label: DEBT_TYPE_LABELS[value],
}));

export const debtSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  type: debtTypeSchema,
  currentBalance: z.coerce.number().positive("Balance must be greater than 0"),
  /** What the balance started at — used only to show "% paid off" progress; optional. */
  originalAmount: optionalPositiveNumber(),
  /** Annual percentage rate, e.g. 19.9 for a typical credit card. */
  interestRate: z.coerce.number().min(0, "Rate can't be negative").max(100, "That's a very high rate — double check it"),
  /** Monthly payment used for payoff projections; optional (some debts, like
   * a mortgage, might just be tracked without a projection). */
  minimumPayment: optionalPositiveNumber(),
  linkedCategoryId: z.string().optional(),
  notes: z.string().trim().max(500).optional(),
  startDate: optionalDate,
});

export type DebtInput = z.infer<typeof debtSchema>;

export type Debt = DebtInput & {
  id: string;
};
