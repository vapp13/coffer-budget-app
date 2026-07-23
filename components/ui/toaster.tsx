"use client";

import { Toaster as SonnerToaster } from "sonner";
import { useTheme } from "@/lib/theme/theme-provider";

export function Toaster() {
  const { theme } = useTheme();

  return (
    <SonnerToaster
      theme={theme}
      position="top-center"
      toastOptions={{
        classNames: {
          toast: "!bg-surface !text-foreground !border !border-border !shadow-lg",
          description: "!text-muted-foreground",
          actionButton: "!bg-primary !text-primary-foreground",
        },
      }}
    />
  );
}
