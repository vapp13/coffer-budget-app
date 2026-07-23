import { z } from "zod";

export const DEDUCTION_TYPES = [
  "paye",
  "national_insurance",
  "pension",
  "student_loan",
  "postgraduate_loan",
  "salary_sacrifice",
  "healthcare",
  "union_fees",
  "other",
] as const;

export const deductionTypeSchema = z.enum(DEDUCTION_TYPES);
export type DeductionType = z.infer<typeof deductionTypeSchema>;

export const DEDUCTION_TYPE_LABELS: Record<DeductionType, string> = {
  paye: "PAYE",
  national_insurance: "National Insurance",
  pension: "Pension Contribution",
  student_loan: "Student Loan",
  postgraduate_loan: "Postgraduate Loan",
  salary_sacrifice: "Salary Sacrifice",
  healthcare: "Healthcare",
  union_fees: "Union Fees",
  other: "Other",
};

export const DEDUCTION_TYPE_OPTIONS = DEDUCTION_TYPES.map((value) => ({
  value,
  label: DEDUCTION_TYPE_LABELS[value],
}));

export const deductionSchema = z.object({
  type: deductionTypeSchema,
  /** A custom name, used (and required in the form) when type is "other". */
  customLabel: z.string().trim().max(60).optional(),
  /** Entered as a monthly amount, matching how most payslips report deductions. */
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  notes: z.string().trim().max(300).optional(),
});

export type DeductionInput = z.infer<typeof deductionSchema>;

export type Deduction = DeductionInput & {
  id: string;
};

export function deductionDisplayLabel(deduction: Pick<Deduction, "type" | "customLabel">): string {
  if (deduction.type === "other" && deduction.customLabel) return deduction.customLabel;
  return DEDUCTION_TYPE_LABELS[deduction.type];
}
