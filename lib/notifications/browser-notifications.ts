const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export type NotificationSupport = "unsupported" | "granted" | "denied" | "default";

/** Whether the browser supports the Notification API at all — Safari on
 * older iOS versions and some in-app browsers don't. */
export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationPermission(): NotificationSupport {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission;
}

/** Must be called from a user gesture (a click handler) — most browsers
 * silently ignore permission requests made any other way. */
export async function requestNotificationPermission(): Promise<NotificationSupport> {
  if (!isNotificationSupported()) return "unsupported";
  const result = await Notification.requestPermission();
  return result;
}

/**
 * Shows a real OS-level notification. Prefers going through the service
 * worker registration (`showNotification`) since that's more consistent
 * across browsers and supports things like icons reliably; falls back to
 * the plain `Notification` constructor if no registration is available yet.
 */
export async function showLocalNotification(title: string, body: string): Promise<void> {
  if (!isNotificationSupported() || Notification.permission !== "granted") return;

  const icon = `${basePath}/icon-192.png`;

  if ("serviceWorker" in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.showNotification(title, { body, icon });
      return;
    }
  }

  new Notification(title, { body, icon });
}
