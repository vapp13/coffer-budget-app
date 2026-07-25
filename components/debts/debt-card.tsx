"use client";

import { useState } from "react";
import { Pencil, Trash2, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { cn } from "@/lib/utils";
import { round2 } from "@/lib/calculations/math-helpers";
import {
  calculatePayoffProjection,
  calculateRequiredPayment,
  calculatePaidOffPercentage,
} from "@/lib/calculations/debt";
import { DEBT_TYPE_LABELS, type Debt } from "@/lib/validation/debt";

type DebtCardProps = {
  debt: Debt;
  formatCurrency: (value: number) => string;
  onEdit: () => void;
  onDelete: () => void;
};

type CalculatorMode = "byPayment" | "byMonths";

export function DebtCard({ debt, formatCurrency, onEdit, onDelete }: DebtCardProps) {
  const [mode, setMode] = useState<CalculatorMode>("byPayment");
  const [paymentInput, setPaymentInput] = useState("");
  const [monthsInput, setMonthsInput] = useState("");

  const paidOffPercentage = calculatePaidOffPercentage(debt.currentBalance, debt.originalAmount);

  const effectivePayment = paymentInput ? parseFloat(paymentInput) : debt.minimumPayment ?? 0;
  const projection =
    mode === "byPayment" && effectivePayment > 0
      ? calculatePayoffProjection(debt.currentBalance, debt.interestRate, effectivePayment)
      : null;

  const targetMonths = monthsInput ? parseInt(monthsInput, 10) : 0;
  const requiredPayment =
    mode === "byMonths" && targetMonths > 0
      ? calculateRequiredPayment(debt.currentBalance, debt.interestRate, targetMonths)
      : null;
  const requiredPaymentInterest =
    requiredPayment !== null ? round2(requiredPayment * targetMonths - debt.currentBalance) : null;

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{debt.name}</p>
          <p className="text-xs text-muted-foreground">
            {DEBT_TYPE_LABELS[debt.type]} · {debt.interestRate}% APR
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" onClick={onEdit} aria-label={`Edit ${debt.name}`} className="px-2">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" onClick={onDelete} aria-label={`Remove ${debt.name}`} className="px-2">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-baseline justify-between">
        <span className="text-xs text-muted-foreground">Balance</span>
        <span className="font-display text-lg font-semibold tabular-nums">
          {formatCurrency(debt.currentBalance)}
        </span>
      </div>

      {paidOffPercentage !== null && (
        <div className="flex flex-col gap-1.5">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500"
              style={{ width: `${paidOffPercentage * 100}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">{(paidOffPercentage * 100).toFixed(0)}% paid off</p>
        </div>
      )}

      <div className="flex flex-col gap-2 border-t border-border pt-3">
        <div className="flex items-center gap-1.5">
          <TrendingDown className="h-3.5 w-3.5 text-accent" />
          <span className="text-xs font-medium">Payoff calculator</span>
          <InfoTooltip title="Payoff calculator">
            Estimates how a debt like this plays out — either how long a monthly payment takes
            to clear it, or how much you'd need to pay each month to clear it by a target date.
            Uses your interest rate, so it accounts for the interest that accrues while you pay it down.
          </InfoTooltip>
        </div>

        <div className="flex rounded-md border border-border p-0.5" role="group" aria-label="Calculator mode">
          <button
            type="button"
            onClick={() => setMode("byPayment")}
            aria-pressed={mode === "byPayment"}
            className={cn(
              "flex-1 rounded px-2 py-1.5 text-xs font-medium transition",
              mode === "byPayment" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            )}
          >
            By payment
          </button>
          <button
            type="button"
            onClick={() => setMode("byMonths")}
            aria-pressed={mode === "byMonths"}
            className={cn(
              "flex-1 rounded px-2 py-1.5 text-xs font-medium transition",
              mode === "byMonths" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            )}
          >
            By payoff date
          </button>
        </div>

        {mode === "byPayment" && (
          <>
            <Label htmlFor={`payment-${debt.id}`} className="text-xs">
              Monthly payment
            </Label>
            <Input
              id={`payment-${debt.id}`}
              type="number"
              step="0.01"
              placeholder={debt.minimumPayment ? debt.minimumPayment.toFixed(2) : "0.00"}
              value={paymentInput}
              onChange={(event) => setPaymentInput(event.target.value)}
            />
            {projection &&
              (projection.months === null ? (
                <p className="text-xs font-medium text-negative">
                  This payment won't cover the interest — the balance will never shrink at this rate.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Paid off in{" "}
                  <span className="font-medium text-foreground">
                    {projection.months} month{projection.months === 1 ? "" : "s"}
                  </span>{" "}
                  (~{(projection.months / 12).toFixed(1)} years), paying about{" "}
                  <span className="font-medium text-foreground">
                    {formatCurrency(projection.totalInterest ?? 0)}
                  </span>{" "}
                  in interest.
                </p>
              ))}
          </>
        )}

        {mode === "byMonths" && (
          <>
            <Label htmlFor={`months-${debt.id}`} className="text-xs">
              Pay off within (months)
            </Label>
            <Input
              id={`months-${debt.id}`}
              type="number"
              step="1"
              min="1"
              placeholder="e.g. 12"
              value={monthsInput}
              onChange={(event) => setMonthsInput(event.target.value)}
            />
            {requiredPayment !== null && (
              <p className="text-xs text-muted-foreground">
                Requires{" "}
                <span className="font-medium text-foreground">
                  {formatCurrency(requiredPayment)}/month
                </span>
                , paying about{" "}
                <span className="font-medium text-foreground">
                  {formatCurrency(requiredPaymentInterest ?? 0)}
                </span>{" "}
                in interest.
              </p>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
