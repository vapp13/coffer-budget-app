"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/auth-context";
import { listTaxProfiles, ensureDefaultTaxProfile } from "@/lib/data/tax-profiles";

/**
 * Returns the user's current tax profile. MVP assumption: one active
 * profile per user (the first one found). Multiple profiles with
 * effective date ranges — for correctly recomputing past tax years —
 * is a good candidate for the historical-tracking milestone.
 */
export function useTaxProfile() {
  const { user } = useAuth();
  const userId = user?.uid;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["taxProfiles", userId],
    queryFn: () => listTaxProfiles(userId as string),
    enabled: !!userId,
  });

  useEffect(() => {
    if (!userId || !query.isSuccess) return;
    if (query.data.length === 0) {
      ensureDefaultTaxProfile(userId).then(() => {
        queryClient.invalidateQueries({ queryKey: ["taxProfiles", userId] });
      });
    }
  }, [userId, query.isSuccess, query.data, queryClient]);

  return {
    taxProfile: query.data?.[0],
    isLoading: query.isLoading || (query.isSuccess && query.data.length === 0),
  };
}
