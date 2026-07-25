"use client";

import { useEffect, useRef } from "react";
import { useCategories } from "@/hooks/use-categories";
import { Skeleton } from "@/components/ui/skeleton";
import { OnboardingNavBar } from "@/components/onboarding/onboarding-nav-bar";

type OnboardingCategoriesStepProps = {
  onNext: () => void;
  onBack: () => void;
};

export function OnboardingCategoriesStep({ onNext, onBack }: OnboardingCategoriesStepProps) {
  const { data: categories, isLoading, restoreDefaults } = useCategories();
  const hasRequestedRestore = useRef(false);

  // Displaying "ready-made" categories is only true if the list is
  // actually current — an account whose categories were seeded before a
  // new default (like Rent) was added would otherwise never see it here.
  // Reuses the same restore-defaults mechanism as Settings; silent and a
  // no-op if nothing's missing, so it's safe to always call once on load.
  useEffect(() => {
    if (hasRequestedRestore.current || isLoading || !categories) return;
    hasRequestedRestore.current = true;
    restoreDefaults.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, categories]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-display text-lg font-semibold">Your categories are ready</h2>
        <p className="text-sm text-muted-foreground">
          Every expense gets sorted into one of these — we've set up the common ones for you.
          You can rename, recolor, add your own, or delete any of these any time from Settings.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {categories?.map((category) => (
            <div
              key={category.id}
              className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <span className="truncate">{category.name}</span>
            </div>
          ))}
        </div>
      )}

      <OnboardingNavBar onBack={onBack} onContinue={onNext} />
    </div>
  );
}
