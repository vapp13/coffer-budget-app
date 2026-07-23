"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/auth-context";
import {
  listExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  setExpenseActive,
} from "@/lib/data/expenses";
import { archiveExpiredExpenses } from "@/lib/data/archive-expired-expenses";
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

  // Auto-archive expired one-time and end-dated recurring expenses. Safe to
  // run on every load — a no-op once nothing needs archiving.
  useEffect(() => {
    if (!userId || !query.isSuccess) return;
    archiveExpiredExpenses(userId).then((didArchive) => {
      if (didArchive) invalidate();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, query.isSuccess]);

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

  const archiveExpense = useMutation({
    mutationFn: (id: string) => setExpenseActive(userId as string, id, false),
    onSuccess: invalidate,
  });

  const restoreExpense = useMutation({
    mutationFn: (id: string) => setExpenseActive(userId as string, id, true),
    onSuccess: invalidate,
  });

  return {
    ...query,
    createExpense,
    editExpense,
    removeExpense,
    archiveExpense,
    restoreExpense,
  };
}
