"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useIncomeSources } from "@/hooks/use-income-sources";
import { INCOME_SOURCE_TYPE_OPTIONS, incomeSourceTypeSchema } from "@/lib/validation/income-source";
import { Input } from "@/components/ui/input";
import { Label, FieldError } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { OnboardingNavBar } from "@/components/onboarding/onboarding-nav-bar";

const quickIncomeSchema = z.object({
  label: z.string().trim().max(120),
  source: incomeSourceTypeSchema,
  grossYearlyAmount: z.coerce.number().min(0).optional(),
});

type QuickIncomeInput = z.infer<typeof quickIncomeSchema>;

type OnboardingIncomeStepProps = {
  onNext: () => void;
  onBack: () => void;
};

export function OnboardingIncomeStep({ onNext, onBack }: OnboardingIncomeStepProps) {
  const { createIncomeSource } = useIncomeSources();

  const {
    register,
    getValues,
    trigger,
    formState: { errors },
  } = useForm<QuickIncomeInput>({
    resolver: zodResolver(quickIncomeSchema),
    defaultValues: { source: "main_job" },
  });

  async function handleContinue() {
    const values = getValues();
    const isEmpty = !values.label?.trim() && !values.grossYearlyAmount;

    if (isEmpty) {
      onNext();
      return;
    }

    // Something was entered — validate it properly before saving. A label
    // with no amount (or vice versa) should show an error and stay put,
    // not silently skip or save something incomplete.
    const isValid = await trigger(["label", "grossYearlyAmount"]);
    if (!isValid || !values.grossYearlyAmount) {
      if (!values.grossYearlyAmount) {
        toast.error("Enter an amount, or clear the label to skip this step.");
      }
      return;
    }

    try {
      await createIncomeSource.mutateAsync({
        label: values.label,
        source: values.source,
        grossYearlyAmount: values.grossYearlyAmount,
        effectiveFrom: new Date(),
      });
      toast.success("Income added");
      onNext();
    } catch {
      toast.error("Couldn't add that — try again.");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-display text-lg font-semibold">What's your income?</h2>
        <p className="text-sm text-muted-foreground">
          Just your main source for now — you can add more later, along with deductions. Leave
          this blank to skip.
        </p>
      </div>

      <div className="flex flex-col gap-4">
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
      </div>

      <OnboardingNavBar onBack={onBack} onContinue={handleContinue} isContinuing={createIncomeSource.isPending} />
    </div>
  );
}
