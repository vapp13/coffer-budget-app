"use client";

import { useState } from "react";
import { Sparkles, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OnboardingIncomeStep } from "@/components/onboarding/onboarding-income-step";
import { OnboardingCategoriesStep } from "@/components/onboarding/onboarding-categories-step";
import { OnboardingExpensesStep } from "@/components/onboarding/onboarding-expenses-step";
import { OnboardingNavBar } from "@/components/onboarding/onboarding-nav-bar";
import { cn } from "@/lib/utils";

const STEPS = ["welcome", "income", "categories", "expenses", "done"] as const;
type Step = (typeof STEPS)[number];

type OnboardingFlowProps = {
  onFinish: () => void;
};

export function OnboardingFlow({ onFinish }: OnboardingFlowProps) {
  const [step, setStep] = useState<Step>("welcome");
  const stepIndex = STEPS.indexOf(step);

  function goTo(next: Step) {
    setStep(next);
  }

  // Every step stays mounted the whole time (just hidden), rather than
  // being conditionally rendered — so going Back never wipes out anything
  // half-typed in an earlier step's form.
  function panelClass(forStep: Step) {
    return cn("flex-1 flex flex-col justify-center", forStep === step ? "flex" : "hidden");
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center gap-2 px-4 pt-4 sm:px-6">
        {STEPS.slice(0, -1).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              i <= stepIndex ? "bg-primary" : "bg-muted"
            )}
          />
        ))}
      </div>

      <div className="flex items-center justify-end px-4 pt-3 sm:px-6">
        {step !== "done" && (
          <button
            type="button"
            onClick={onFinish}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Skip setup
          </button>
        )}
      </div>

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-8 sm:px-6">
        <div className={panelClass("welcome")}>
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/60">
              <Sparkles className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="font-display text-2xl font-semibold">Welcome to Coffer</h1>
            <p className="text-sm text-muted-foreground">
              Let's get your budget set up — it only takes a minute. We'll add your income, show
              you around your categories, and log your first expense.
            </p>
            <Button onClick={() => goTo("income")} className="mt-2 w-full sm:w-auto">
              Let's get started
            </Button>
          </div>
        </div>

        <div className={panelClass("income")}>
          <OnboardingIncomeStep onNext={() => goTo("categories")} onBack={() => goTo("welcome")} />
        </div>

        <div className={panelClass("categories")}>
          <OnboardingCategoriesStep onNext={() => goTo("expenses")} onBack={() => goTo("income")} />
        </div>

        <div className={panelClass("expenses")}>
          <OnboardingExpensesStep onNext={() => goTo("done")} onBack={() => goTo("categories")} />
        </div>

        <div className={panelClass("done")}>
          <div className="flex flex-col gap-5">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/60">
                <PartyPopper className="h-7 w-7 text-primary-foreground" />
              </div>
              <h1 className="font-display text-2xl font-semibold">You're all set 🎉</h1>
              <p className="text-sm text-muted-foreground">
                Nice work — your dashboard is ready. Everything you just added (or skipped) can be
                changed any time: add more income and expenses, set budgets, track goals and debts,
                and fine-tune categories, currency, and theme from Settings.
              </p>
            </div>
            <OnboardingNavBar onBack={() => goTo("expenses")} onContinue={onFinish} continueLabel="Go to my dashboard" />
          </div>
        </div>
      </div>
    </div>
  );
}
