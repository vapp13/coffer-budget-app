"use client";

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/auth-context";
import { listGoals, addGoal, updateGoal, deleteGoal } from "@/lib/data/goals";
import type { GoalInput } from "@/lib/validation/goal";

export function useGoals() {
  const { user } = useAuth();
  const userId = user?.uid;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["goals", userId],
    queryFn: () => listGoals(userId as string),
    enabled: !!userId,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["goals", userId] });
  }

  const createGoal = useMutation({
    mutationFn: (input: GoalInput) => addGoal(userId as string, input),
    onSuccess: invalidate,
  });

  const editGoal = useMutation({
    mutationFn: ({ id, input }: { id: string; input: GoalInput }) =>
      updateGoal(userId as string, id, input),
    onSuccess: invalidate,
  });

  const removeGoal = useMutation({
    mutationFn: (id: string) => deleteGoal(userId as string, id),
    onSuccess: invalidate,
  });

  return { ...query, createGoal, editGoal, removeGoal };
}
