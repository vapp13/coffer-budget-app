"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { deductionSchema, DEDUCTION_TYPE_OPTIONS, type DeductionInput } from "@/lib/validation/deduction";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, FieldError } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type DeductionFormProps = {
  defaultValues?: Partial<DeductionInput>;
  onSubmit: (input: DeductionInput) => void | Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
};

/**
 * Deliberately NOT a <form> element. This is always embedded inside
 * IncomeSourceForm's own <form>, and a nested <form> is invalid HTML —
 * browsers resolve nested-form submit events unpredictably, which is what
 * caused deductions to silently fail to save. react-hook-form's
 * handleSubmit works fine bound to a plain button's onClick instead of a
 * form's onSubmit, so that's what triggers validation + submission here.
 */
export function DeductionForm({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting,
  submitLabel = "Add deduction",
}: DeductionFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<DeductionInput>({
    resolver: zodResolver(deductionSchema),
    defaultValues: { type: "paye", ...defaultValues },
  });

  const type = watch("type");

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="type">Type</Label>
          <Select id="type" {...register("type")}>
            {DEDUCTION_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <FieldError message={errors.type?.message} />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="amount">Monthly amount</Label>
          <Input id="amount" type="number" step="0.01" placeholder="0.00" {...register("amount")} />
          <FieldError message={errors.amount?.message} />
        </div>
      </div>

      {type === "other" && (
        <div className="flex flex-col gap-1">
          <Label htmlFor="customLabel">Custom name</Label>
          <Input id="customLabel" placeholder="e.g. Season ticket loan" {...register("customLabel")} />
          <FieldError message={errors.customLabel?.message} />
        </div>
      )}

      <div className="flex flex-col gap-1">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Input id="notes" placeholder="Anything worth remembering" {...register("notes")} />
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : submitLabel}
        </Button>
      </div>
    </div>
  );
}
