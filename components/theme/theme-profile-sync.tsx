"use client";

import { useEffect } from "react";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useTheme, resolveSystemTheme } from "@/lib/theme/theme-provider";

/**
 * Renders nothing — just applies the signed-in user's saved theme
 * preference on load, so switching devices carries the choice with it.
 * "system" resolves to the OS setting at the moment the profile loads.
 */
export function ThemeProfileSync() {
  const { data: profile } = useUserProfile();
  const { setTheme } = useTheme();

  useEffect(() => {
    if (!profile?.themePreference) return;
    const resolved =
      profile.themePreference === "system"
        ? resolveSystemTheme()
        : profile.themePreference;
    setTheme(resolved);
    // Only re-run when the saved preference itself changes, not on every
    // theme toggle — otherwise toggling would immediately get overwritten
    // back to the saved value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.themePreference]);

  return null;
}
