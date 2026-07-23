"use client";

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/auth-context";
import {
  listIncomeSources,
  addIncomeSource,
  updateIncomeSource,
  deleteIncomeSource,
} from "@/lib/data/income-sources";
import type { IncomeSourceInput } from "@/lib/validation/income-source";

export function useIncomeSources() {
  const { user } = useAuth();
  const userId = user?.uid;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["incomeSources", userId],
    queryFn: () => listIncomeSources(userId as string),
    enabled: !!userId,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["incomeSources", userId] });
  }

  const createIncomeSource = useMutation({
    mutationFn: (input: IncomeSourceInput) =>
      addIncomeSource(userId as string, input),
    onSuccess: invalidate,
  });

  const editIncomeSource = useMutation({
    mutationFn: ({ id, input }: { id: string; input: IncomeSourceInput }) =>
      updateIncomeSource(userId as string, id, input),
    onSuccess: invalidate,
  });

  const removeIncomeSource = useMutation({
    mutationFn: (id: string) => deleteIncomeSource(userId as string, id),
    onSuccess: invalidate,
  });

  return { ...query, createIncomeSource, editIncomeSource, removeIncomeSource };
}
