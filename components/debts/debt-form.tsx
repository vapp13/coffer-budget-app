"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { debtSchema, DEBT_TYPE_OPTIONS, type DebtInput } from "@/lib/validation/debt";
import { useCategories } from "@/hooks/use-categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, FieldError } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type DebtFormDefaults = Partial<Omit<DebtInput, "startDate">> & { startDate?: string };

type DebtFormProps = {
  defaultValues?: DebtFormDefaults;
  onSubmit: (input: DebtInput) => void | Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
};

export function DebtForm({ defaultValues, onSubmit, isSubmitting, submitLabel = "Add debt" }: DebtFormProps) {
  const { data: categories } = useCategories();
  const financialCategories = (categories ?? []).filter((c) => c.group === "Financial");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DebtInput>({
    resolver: zodResolver(debtSchema),
    defaultValues: { type: "credit_card", ...defaultValues } as DebtInput,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Label htmlFor="name">Name</Label>
        <Input id="name" placeholder="e.g. Visa Credit Card" {...register("name")} />
        <FieldError message={errors.name?.message} />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="type">Type</Label>
        <Select id="type" {...register("type")}>
          {DEBT_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <FieldError message={errors.type?.message} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="currentBalance">Current balance</Label>
          <Input id="currentBalance" type="number" step="0.01" placeholder="0.00" {...register("currentBalance")} />
          <FieldError message={errors.currentBalance?.message} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="originalAmount">Original amount (optional)</Label>
          <Input id="originalAmount" type="number" step="0.01" placeholder="0.00" {...register("originalAmount")} />
          <FieldError message={errors.originalAmount?.message} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="interestRate">Interest rate (APR %)</Label>
          <Input id="interestRate" type="number" step="0.01" placeholder="e.g. 19.9" {...register("interestRate")} />
          <FieldError message={errors.interestRate?.message} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="minimumPayment">Monthly payment (optional)</Label>
          <Input id="minimumPayment" type="number" step="0.01" placeholder="0.00" {...register("minimumPayment")} />
          <p className="text-xs text-muted-foreground">Used to estimate payoff time — you can adjust this later.</p>
          <FieldError message={errors.minimumPayment?.message} />
        </div>
      </div>

      {financialCategories.length > 0 && (
        <div className="flex flex-col gap-1">
          <Label htmlFor="linkedCategoryId">Linked category (optional)</Label>
          <Select id="linkedCategoryId" {...register("linkedCategoryId")}>
            <option value="">None</option>
            {financialCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </div>
      )}

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
