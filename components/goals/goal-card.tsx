"use client";

import { Pencil, Trash2, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GOAL_TYPE_LABELS, type Goal } from "@/lib/validation/goal";

type GoalCardProps = {
  goal: Goal;
  formatCurrency: (value: number) => string;
  formatDate: (date: Date | undefined | null) => string;
  onEdit: () => void;
  onDelete: () => void;
};

export function GoalCard({ goal, formatCurrency, formatDate, onEdit, onDelete }: GoalCardProps) {
  const ratio = goal.targetAmount > 0 ? goal.currentAmount / goal.targetAmount : 0;
  const percentage = Math.min(Math.max(ratio, 0), 1) * 100;
  const isComplete = goal.currentAmount >= goal.targetAmount;

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{goal.name}</p>
          <p className="text-xs text-muted-foreground">{GOAL_TYPE_LABELS[goal.type]}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" onClick={onEdit} aria-label={`Edit ${goal.name}`} className="px-2">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" onClick={onDelete} aria-label={`Remove ${goal.name}`} className="px-2">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-[width] duration-500", isComplete ? "bg-primary" : "bg-accent")}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="tabular-nums">
          {formatCurrency(goal.currentAmount)} of {formatCurrency(goal.targetAmount)}
        </span>
        <span className="flex items-center gap-1 font-medium">
          {isComplete && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
          {percentage.toFixed(0)}%
        </span>
      </div>

      {goal.targetDate && (
        <p className="text-xs text-muted-foreground">Target date: {formatDate(goal.targetDate)}</p>
      )}
    </Card>
  );
}
