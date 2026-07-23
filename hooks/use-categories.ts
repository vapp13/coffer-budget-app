"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/auth-context";
import {
  listCategories,
  addCategory,
  updateCategory,
  ensureDefaultCategories,
} from "@/lib/data/categories";
import { dedupeCategories } from "@/lib/data/dedupe-categories";
import type { CategoryInput } from "@/lib/validation/category";

export function useCategories() {
  const { user } = useAuth();
  const userId = user?.uid;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["categories", userId],
    queryFn: () => listCategories(userId as string),
    enabled: !!userId,
  });

  useEffect(() => {
    if (!userId || !query.isSuccess) return;

    if (query.data.length === 0) {
      // First-run seeding: brand-new user, create the defaults once.
      ensureDefaultCategories(userId).then(() => {
        queryClient.invalidateQueries({ queryKey: ["categories", userId] });
      });
    } else {
      // Clean up any duplicates left over from before seeding was made
      // transaction-safe. No-ops once there's nothing left to merge.
      dedupeCategories(userId).then((didDedupe) => {
        if (didDedupe) {
          queryClient.invalidateQueries({ queryKey: ["categories", userId] });
          queryClient.invalidateQueries({ queryKey: ["expenses", userId] });
        }
      });
    }
  }, [userId, query.isSuccess, query.data, queryClient]);

  const createCategory = useMutation({
    mutationFn: (input: CategoryInput) => addCategory(userId as string, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["categories", userId] }),
  });

  const editCategory = useMutation({
    mutationFn: ({ id, input }: { id: string; input: CategoryInput }) =>
      updateCategory(userId as string, id, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["categories", userId] }),
  });

  return { ...query, createCategory, editCategory };
}
