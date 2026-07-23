"use client";

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/auth-context";
import {
  listDeductions,
  addDeduction,
  updateDeduction,
  deleteDeduction,
} from "@/lib/data/deductions";
import type { DeductionInput } from "@/lib/validation/deduction";

export function useDeductions(incomeSourceId: string | undefined) {
  const { user } = useAuth();
  const userId = user?.uid;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["deductions", userId, incomeSourceId],
    queryFn: () => listDeductions(userId as string, incomeSourceId as string),
    enabled: !!userId && !!incomeSourceId,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["deductions", userId, incomeSourceId] });
  }

  const createDeduction = useMutation({
    mutationFn: (input: DeductionInput) =>
      addDeduction(userId as string, incomeSourceId as string, input),
    onSuccess: invalidate,
  });

  const editDeduction = useMutation({
    mutationFn: ({ id, input }: { id: string; input: DeductionInput }) =>
      updateDeduction(userId as string, incomeSourceId as string, id, input),
    onSuccess: invalidate,
  });

  const removeDeduction = useMutation({
    mutationFn: (id: string) => deleteDeduction(userId as string, incomeSourceId as string, id),
    onSuccess: invalidate,
  });

  return { ...query, createDeduction, editDeduction, removeDeduction };
}
