"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type OnboardingNavBarProps = {
  /** Omit entirely on the first step — no back button should show there. */
  onBack?: () => void;
  onContinue: () => void;
  continueLabel?: string;
  isContinuing?: boolean;
};

export function OnboardingNavBar({
  onBack,
  onContinue,
  continueLabel = "Continue",
  isContinuing,
}: OnboardingNavBarProps) {
  return (
    <div className="flex items-center justify-between gap-3 pt-2">
      {onBack ? (
        <Button type="button" variant="outline" onClick={onBack} aria-label="Back">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      ) : (
        <span />
      )}
      <Button type="button" onClick={onContinue} disabled={isContinuing} aria-label="Continue">
        {isContinuing ? "Saving…" : continueLabel}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
