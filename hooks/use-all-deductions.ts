"use client";

import { useQueries } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/auth-context";
import { listDeductions } from "@/lib/data/deductions";
import type { Deduction } from "@/lib/validation/deduction";
import type { IncomeSource } from "@/lib/validation/income-source";

export function useAllDeductions(incomeSources: IncomeSource[] | undefined) {
  const { user } = useAuth();
  const userId = user?.uid;
  const sources = incomeSources ?? [];

  const queries = useQueries({
    queries: sources.map((source) => ({
      queryKey: ["deductions", userId, source.id],
      queryFn: () => listDeductions(userId as string, source.id),
      enabled: !!userId,
    })),
  });

  const isLoading = queries.some((q) => q.isLoading);
  const deductionsBySourceId: Record<string, Deduction[]> = {};
  sources.forEach((source, index) => {
    deductionsBySourceId[source.id] = queries[index]?.data ?? [];
  });

  return { deductionsBySourceId, isLoading };
}
