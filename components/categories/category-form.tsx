"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { categorySchema, type CategoryInput } from "@/lib/validation/category";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, FieldError } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type CategoryFormProps = {
  defaultValues?: Partial<CategoryInput>;
  onSubmit: (input: CategoryInput) => void | Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
};

export function CategoryForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  submitLabel = "Add category",
}: CategoryFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: { group: "Personal", color: "#8A9199", ...defaultValues },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Label htmlFor="name">Name</Label>
        <Input id="name" placeholder="e.g. Pet care" {...register("name")} />
        <FieldError message={errors.name?.message} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="group">Group</Label>
          <Select id="group" {...register("group")}>
            <option value="House">House</option>
            <option value="Personal">Personal</option>
            <option value="Financial">Financial</option>
          </Select>
          <FieldError message={errors.group?.message} />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="color">Color</Label>
          <div className="flex h-11 items-center gap-2 rounded-md border border-border px-2">
            <input
              id="color"
              type="color"
              className="h-8 w-8 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0"
              {...register("color")}
            />
            <span className="text-sm text-muted-foreground">Tap to choose</span>
          </div>
          <FieldError message={errors.color?.message} />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="monthlyBudget">Monthly budget limit (optional)</Label>
        <Input
          id="monthlyBudget"
          type="number"
          step="0.01"
          placeholder="0.00"
          {...register("monthlyBudget")}
        />
        <FieldError message={errors.monthlyBudget?.message} />
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
