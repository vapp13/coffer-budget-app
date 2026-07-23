"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/auth-context";
import { getUserProfile, updateUserProfile, ensureUserProfile } from "@/lib/data/user-profile";
import type { UserProfileFormInput } from "@/lib/validation/user-profile";

export function useUserProfile() {
  const { user } = useAuth();
  const userId = user?.uid;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["userProfile", userId],
    queryFn: () => getUserProfile(userId as string),
    enabled: !!userId,
  });

  useEffect(() => {
    if (!userId || !query.isSuccess || query.data) return;
    ensureUserProfile(userId, {
      displayName: user?.displayName ?? null,
      photoURL: user?.photoURL ?? null,
    }).then(() => {
      queryClient.invalidateQueries({ queryKey: ["userProfile", userId] });
    });
  }, [userId, query.isSuccess, query.data, user, queryClient]);

  const saveProfile = useMutation({
    mutationFn: (input: UserProfileFormInput) =>
      updateUserProfile(userId as string, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["userProfile", userId] }),
  });

  return { ...query, saveProfile };
}
