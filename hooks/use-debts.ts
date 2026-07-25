"use client";

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/auth-context";
import { listDebts, addDebt, updateDebt, deleteDebt } from "@/lib/data/debts";
import type { DebtInput } from "@/lib/validation/debt";

export function useDebts() {
  const { user } = useAuth();
  const userId = user?.uid;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["debts", userId],
    queryFn: () => listDebts(userId as string),
    enabled: !!userId,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["debts", userId] });
  }

  const createDebt = useMutation({
    mutationFn: (input: DebtInput) => addDebt(userId as string, input),
    onSuccess: invalidate,
  });

  const editDebt = useMutation({
    mutationFn: ({ id, input }: { id: string; input: DebtInput }) =>
      updateDebt(userId as string, id, input),
    onSuccess: invalidate,
  });

  const removeDebt = useMutation({
    mutationFn: (id: string) => deleteDebt(userId as string, id),
    onSuccess: invalidate,
  });

  return { ...query, createDebt, editDebt, removeDebt };
}
