"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  incomeSourceSchema,
  INCOME_SOURCE_TYPE_OPTIONS,
  type IncomeSourceInput,
} from "@/lib/validation/income-source";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, FieldError } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

// Dates arrive as yyyy-mm-dd strings when editing (native date inputs need
// a string, not a Date object) — see lib/date-input-value.ts.
type IncomeSourceFormDefaults = Partial<Omit<IncomeSourceInput, "effectiveFrom" | "effectiveTo">> & {
  effectiveFrom?: string;
  effectiveTo?: string;
};

type IncomeSourceFormProps = {
  defaultValues?: IncomeSourceFormDefaults;
  onSubmit: (input: IncomeSourceInput) => void | Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
};

export function IncomeSourceForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  submitLabel = "Add income source",
}: IncomeSourceFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<IncomeSourceInput>({
    resolver: zodResolver(incomeSourceSchema),
    defaultValues: {
      source: "other",
      ...defaultValues,
    } as unknown as IncomeSourceInput,
  });

  async function submit(values: IncomeSourceInput) {
    await onSubmit(values);
    reset({ source: "other" } as unknown as IncomeSourceInput);
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Label htmlFor="label">Label</Label>
        <Input id="label" placeholder="e.g. Salary" {...register("label")} />
        <FieldError message={errors.label?.message} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="source">Source</Label>
          <Select id="source" {...register("source")}>
            {INCOME_SOURCE_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <FieldError message={errors.source?.message} />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="grossYearlyAmount">Gross yearly amount</Label>
          <Input
            id="grossYearlyAmount"
            type="number"
            step="0.01"
            placeholder="0.00"
            {...register("grossYearlyAmount")}
          />
          <FieldError message={errors.grossYearlyAmount?.message} />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="sourceDetails">Source details (optional)</Label>
        <Input
          id="sourceDetails"
          placeholder="e.g. Employer, business, or client name"
          {...register("sourceDetails")}
        />
        <FieldError message={errors.sourceDetails?.message} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="effectiveFrom">Effective from</Label>
          <Input id="effectiveFrom" type="date" {...register("effectiveFrom")} />
          <FieldError message={errors.effectiveFrom?.message} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="effectiveTo">Effective to (optional)</Label>
          <Input id="effectiveTo" type="date" {...register("effectiveTo")} />
          <FieldError message={errors.effectiveTo?.message} />
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
