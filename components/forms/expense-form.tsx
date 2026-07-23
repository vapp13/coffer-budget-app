"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { expenseSchema, type ExpenseInput } from "@/lib/validation/expense";
import { useCategories } from "@/hooks/use-categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, FieldError } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const FREQUENCY_OPTIONS: ExpenseInput["frequency"][] = [
  "daily",
  "weekly",
  "fortnightly",
  "monthly",
  "quarterly",
  "yearly",
];

// Dates arrive as yyyy-mm-dd strings when editing (native date inputs need
// a string, not a Date object) — see lib/date-input-value.ts.
type ExpenseFormDefaults = Partial<Omit<ExpenseInput, "startDate" | "endDate">> & {
  startDate?: string;
  endDate?: string;
};

type ExpenseFormProps = {
  defaultValues?: ExpenseFormDefaults;
  onSubmit: (input: ExpenseInput) => void | Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
};

export function ExpenseForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  submitLabel = "Add expense",
}: ExpenseFormProps) {
  const { data: categories } = useCategories();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<ExpenseInput>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      isActive: true,
      frequency: "monthly",
      expenseType: "recurring",
      ...defaultValues,
    } as ExpenseInput,
  });

  const expenseType = watch("expenseType");
  const isOneTime = expenseType === "one_time";

  async function submit(values: ExpenseInput) {
    await onSubmit(values);
    reset({ isActive: true, frequency: "monthly", expenseType: "recurring" });
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Label htmlFor="description">Description</Label>
        <Input id="description" placeholder="e.g. House Mortgage" {...register("description")} />
        <FieldError message={errors.description?.message} />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="expenseType">Type</Label>
        <Select id="expenseType" {...register("expenseType")}>
          <option value="recurring">Recurring — repeats every period, stays active indefinitely</option>
          <option value="one_time">One-time — counts only in its own month, then archives automatically</option>
        </Select>
        <FieldError message={errors.expenseType?.message} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="categoryId">Category</Label>
          <Select id="categoryId" {...register("categoryId")}>
            <option value="">Select…</option>
            {categories?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
          <FieldError message={errors.categoryId?.message} />
        </div>

        {!isOneTime && (
          <div className="flex flex-col gap-1">
            <Label htmlFor="frequency">Frequency</Label>
            <Select id="frequency" {...register("frequency")}>
              {FREQUENCY_OPTIONS.map((frequency) => (
                <option key={frequency} value={frequency}>
                  {frequency.charAt(0).toUpperCase() + frequency.slice(1)}
                </option>
              ))}
            </Select>
            <FieldError message={errors.frequency?.message} />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="unitCost">{isOneTime ? "Cost" : "Cost per occurrence"}</Label>
        <Input
          id="unitCost"
          type="number"
          step="0.01"
          placeholder="0.00"
          {...register("unitCost")}
        />
        <FieldError message={errors.unitCost?.message} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="startDate">{isOneTime ? "Date" : "Start date (optional)"}</Label>
          <Input id="startDate" type="date" {...register("startDate")} />
          <FieldError message={errors.startDate?.message} />
        </div>
        {!isOneTime && (
          <div className="flex flex-col gap-1">
            <Label htmlFor="endDate">End date (optional)</Label>
            <Input id="endDate" type="date" {...register("endDate")} />
            <FieldError message={errors.endDate?.message} />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Input id="notes" placeholder="Anything worth remembering" {...register("notes")} />
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
