"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { goalSchema, GOAL_TYPE_OPTIONS, type GoalInput } from "@/lib/validation/goal";
import { useCategories } from "@/hooks/use-categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, FieldError } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type GoalFormDefaults = Partial<Omit<GoalInput, "targetDate">> & { targetDate?: string };

type GoalFormProps = {
  defaultValues?: GoalFormDefaults;
  onSubmit: (input: GoalInput) => void | Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
};

export function GoalForm({ defaultValues, onSubmit, isSubmitting, submitLabel = "Add goal" }: GoalFormProps) {
  const { data: categories } = useCategories();
  const savingsAndInvestmentCategories = (categories ?? []).filter((c) => c.group === "Financial");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GoalInput>({
    resolver: zodResolver(goalSchema),
    defaultValues: { type: "custom", currentAmount: 0, ...defaultValues } as GoalInput,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Label htmlFor="name">Goal name</Label>
        <Input id="name" placeholder="e.g. Emergency fund" {...register("name")} />
        <FieldError message={errors.name?.message} />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="type">Type</Label>
        <Select id="type" {...register("type")}>
          {GOAL_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <FieldError message={errors.type?.message} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="targetAmount">Target amount</Label>
          <Input id="targetAmount" type="number" step="0.01" placeholder="0.00" {...register("targetAmount")} />
          <FieldError message={errors.targetAmount?.message} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="currentAmount">Current amount</Label>
          <Input id="currentAmount" type="number" step="0.01" placeholder="0.00" {...register("currentAmount")} />
          <FieldError message={errors.currentAmount?.message} />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="targetDate">Target date (optional)</Label>
        <Input id="targetDate" type="date" {...register("targetDate")} />
        <FieldError message={errors.targetDate?.message} />
      </div>

      {savingsAndInvestmentCategories.length > 0 && (
        <div className="flex flex-col gap-1">
          <Label htmlFor="linkedCategoryId">Linked category (optional)</Label>
          <Select id="linkedCategoryId" {...register("linkedCategoryId")}>
            <option value="">None</option>
            {savingsAndInvestmentCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </div>
      )}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
