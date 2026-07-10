import { useQueryClient } from "@tanstack/react-query";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect } from "react";

import { routeForPushData } from "@/features/notifications/notification-routing";
import { NOTIFICATIONS_KEY } from "@/features/notifications/use-notifications";

// Foreground presentation: still surface the banner + keep the OS badge in sync.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
  }),
});

function pushData(
  response: Notifications.NotificationResponse,
): Record<string, unknown> | null {
  const data = response.notification.request.content.data;
  return data && typeof data === "object"
    ? (data as Record<string, unknown>)
    : null;
}

/**
 * Wires the expo-notifications listeners: a foreground arrival refreshes the inbox + badge,
 * and a tap (from background or a cold start) deep-links to the notification's target.
 */
export function usePushListeners() {
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    const invalidateInbox = () =>
      void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });

    // Arrived while the app is foregrounded → the inbox/badge may be stale.
    const received =
      Notifications.addNotificationReceivedListener(invalidateInbox);

    // Tapped while backgrounded → refresh + deep-link.
    const responded = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        invalidateInbox();
        const route = routeForPushData(pushData(response));
        if (route) router.push(route);
      },
    );

    // Cold start: the app was launched by tapping a notification.
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      const route = routeForPushData(pushData(response));
      if (route) router.push(route);
    });

    return () => {
      received.remove();
      responded.remove();
    };
  }, [router, queryClient]);
}
