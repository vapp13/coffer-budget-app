"use client";

import { useEffect } from "react";
import type { BudgetSummary } from "@/lib/calculations/budget-summary";
import type { Goal } from "@/lib/validation/goal";
import { deriveInsights } from "@/lib/insights";
import {
  showLocalNotification,
  isNotificationSupported,
  getNotificationPermission,
} from "@/lib/notifications/browser-notifications";
import { hasNotified, markNotified } from "@/lib/notifications/notification-dedupe";
import { monthKeyFromDate } from "@/lib/date/month";

type UseNotificationChecksOptions = {
  /** The user's own opt-in preference, from their profile. */
  enabled: boolean;
  summary?: BudgetSummary;
  goals?: Goal[];
};

/**
 * Fires real (local, foreground-triggered) notifications for conditions
 * this app already computes — reuses `deriveInsights` for over-budget and
 * ending-soon checks rather than re-deriving those rules separately, so
 * notifications can never drift out of sync with what the Insights card
 * itself shows. Each condition only ever notifies once (per month, for
 * monthly conditions; once ever, for a goal being completed) via a simple
 * localStorage dedupe — see notification-dedupe.ts for why that's enough
 * for a client-only, best-effort feature like this.
 */
export function useNotificationChecks({ enabled, summary, goals }: UseNotificationChecksOptions) {
  useEffect(() => {
    if (!enabled) return;
    if (!isNotificationSupported() || getNotificationPermission() !== "granted") return;

    const now = monthKeyFromDate(new Date());
    const monthTag = `${now.year}-${now.month}`;

    async function run() {
      if (summary) {
        const insights = deriveInsights(summary);

        for (const insight of insights) {
          if (insight.kind === "over-budget") {
            for (const categoryName of insight.categoryNames) {
              const key = `overbudget:${monthTag}:${categoryName}`;
              if (hasNotified(key)) continue;
              await showLocalNotification(
                "Over budget",
                `You're over budget in ${categoryName} this month.`
              );
              markNotified(key);
            }
          }

          if (insight.kind === "ending-soon") {
            for (const description of insight.expenseNames) {
              const key = `ending:${monthTag}:${description}`;
              if (hasNotified(key)) continue;
              await showLocalNotification(
                "Recurring expense ending soon",
                `"${description}" will end this month and be automatically archived.`
              );
              markNotified(key);
            }
          }
        }
      }

      if (goals) {
        for (const goal of goals) {
          if (goal.currentAmount < goal.targetAmount) continue;
          const key = `goal-complete:${goal.id}`;
          if (hasNotified(key)) continue;
          await showLocalNotification("Goal reached! 🎉", `You've hit your "${goal.name}" goal.`);
          markNotified(key);
        }
      }
    }

    run();
  }, [enabled, summary, goals]);
}
