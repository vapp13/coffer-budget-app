"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Bell, BellOff } from "lucide-react";
import { useUserProfile } from "@/hooks/use-user-profile";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  type NotificationSupport,
} from "@/lib/notifications/browser-notifications";

// "checking" is the initial state on both the static-export server render
// and the client's first pass (before the effect below runs) — matching
// exactly avoids a hydration mismatch, since `window`/`Notification` don't
// exist during static generation but do exist immediately in a real browser.
type Status = "checking" | NotificationSupport;

export function NotificationsCard() {
  const { data: profile, toggleNotifications } = useUserProfile();
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    setStatus(isNotificationSupported() ? getNotificationPermission() : "unsupported");
  }, []);

  const enabled = !!profile?.notificationsEnabled && status === "granted";

  async function handleEnable() {
    const result = await requestNotificationPermission();
    setStatus(result);

    if (result === "granted") {
      await toggleNotifications.mutateAsync(true);
      toast.success("Notifications enabled");
    } else if (result === "denied") {
      toast.error("Notifications were blocked — you can allow them in your browser's site settings.");
    }
  }

  async function handleDisable() {
    await toggleNotifications.mutateAsync(false);
    toast.success("Notifications turned off");
  }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-1.5">
        <h2 className="text-sm font-medium">Notifications</h2>
        <InfoTooltip title="Notifications">
          Shows a browser notification for recurring expenses ending this month, categories going
          over budget, and goals you've completed. Only fires while Coffer is open (or was very
          recently open) in this browser — it can't reach you if the app and browser are fully closed.
        </InfoTooltip>
      </div>

      {status === "checking" ? null : status === "unsupported" ? (
        <p className="text-xs text-muted-foreground">
          Notifications aren't supported in this browser.
        </p>
      ) : status === "denied" ? (
        <p className="text-xs text-muted-foreground">
          Notifications are blocked for Coffer in your browser. Allow them in your browser's site
          settings, then reload this page to turn them on here.
        </p>
      ) : enabled ? (
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm">
            <Bell className="h-4 w-4 text-primary" />
            Enabled
          </p>
          <Button variant="outline" onClick={handleDisable} disabled={toggleNotifications.isPending}>
            <BellOff className="h-4 w-4" />
            Turn off
          </Button>
        </div>
      ) : (
        <Button variant="outline" onClick={handleEnable} disabled={toggleNotifications.isPending}>
          <Bell className="h-4 w-4" />
          Enable notifications
        </Button>
      )}
    </Card>
  );
}
