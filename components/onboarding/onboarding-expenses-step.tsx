"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useExpenses } from "@/hooks/use-expenses";
import { useCategories } from "@/hooks/use-categories";
import { Input } from "@/components/ui/input";
import { Label, FieldError } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { OnboardingNavBar } from "@/components/onboarding/onboarding-nav-bar";

const quickExpenseSchema = z.object({
  description: z.string().trim().max(120),
  categoryId: z.string().optional(),
  unitCost: z.coerce.number().min(0).optional(),
  frequency: z.enum(["weekly", "monthly", "yearly"]),
});

type QuickExpenseInput = z.infer<typeof quickExpenseSchema>;

type OnboardingExpensesStepProps = {
  onNext: () => void;
  onBack: () => void;
};

export function OnboardingExpensesStep({ onNext, onBack }: OnboardingExpensesStepProps) {
  const { createExpense } = useExpenses();
  const { data: categories } = useCategories();

  const {
    register,
    getValues,
    trigger,
    formState: { errors },
  } = useForm<QuickExpenseInput>({
    resolver: zodResolver(quickExpenseSchema),
    defaultValues: { frequency: "monthly" },
  });

  async function handleContinue() {
    const values = getValues();
    const isEmpty = !values.description?.trim() && !values.unitCost;

    if (isEmpty) {
      onNext();
      return;
    }

    const isValid = await trigger(["description", "categoryId", "unitCost"]);
    if (!isValid || !values.unitCost || !values.categoryId) {
      if (!values.categoryId) toast.error("Choose a category, or clear the description to skip this step.");
      else if (!values.unitCost) toast.error("Enter a cost, or clear the description to skip this step.");
      return;
    }

    try {
      await createExpense.mutateAsync({
        description: values.description,
        categoryId: values.categoryId,
        unitCost: values.unitCost,
        frequency: values.frequency,
        expenseType: "recurring",
        isActive: true,
      });
      toast.success("Expense added");
      onNext();
    } catch {
      toast.error("Couldn't add that — try again.");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-display text-lg font-semibold">Add your first expense</h2>
        <p className="text-sm text-muted-foreground">
          Start with a big one — rent, a bill, a subscription. Leave this blank to skip; you can
          add the rest any time from the Expenses page.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <Label htmlFor="description">Description</Label>
            <Input id="description" placeholder="e.g. Rent" {...register("description")} />
            <FieldError message={errors.description?.message} />
          </div>
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
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <Label htmlFor="unitCost">Cost</Label>
            <Input id="unitCost" type="number" step="0.01" placeholder="0.00" {...register("unitCost")} />
            <FieldError message={errors.unitCost?.message} />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="frequency">Frequency</Label>
            <Select id="frequency" {...register("frequency")}>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </Select>
          </div>
        </div>
      </div>

      <OnboardingNavBar onBack={onBack} onContinue={handleContinue} isContinuing={createExpense.isPending} />
    </div>
  );
}
