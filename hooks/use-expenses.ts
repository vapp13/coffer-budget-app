"use client";

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/auth-context";
import {
  listExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
} from "@/lib/data/expenses";
import type { ExpenseInput } from "@/lib/validation/expense";

export function useExpenses() {
  const { user } = useAuth();
  const userId = user?.uid;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["expenses", userId],
    queryFn: () => listExpenses(userId as string),
    enabled: !!userId,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["expenses", userId] });
  }

  const createExpense = useMutation({
    mutationFn: (input: ExpenseInput) => addExpense(userId as string, input),
    onSuccess: invalidate,
  });

  const editExpense = useMutation({
    mutationFn: ({ id, input }: { id: string; input: ExpenseInput }) =>
      updateExpense(userId as string, id, input),
    onSuccess: invalidate,
  });

  const removeExpense = useMutation({
    mutationFn: (id: string) => deleteExpense(userId as string, id),
    onSuccess: invalidate,
  });

  return { ...query, createExpense, editExpense, removeExpense };
}
