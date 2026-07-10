import { useSession } from "@ager/auth";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";

import { apiClient } from "@/lib/api/client";

import { toApiPlatform } from "./register-device";

/** The EAS projectId Expo needs to mint a push token; undefined until an EAS build is configured. */
function easProjectId(): string | undefined {
  const fromExtra = Constants.expoConfig?.extra?.eas?.projectId;
  const fromEas = Constants.easConfig?.projectId;
  return (typeof fromExtra === "string" && fromExtra) ||
    (typeof fromEas === "string" && fromEas)
    ? fromExtra || fromEas
    : undefined;
}

const appVersion = Constants.expoConfig?.version ?? null;

/**
 * Registers this device's Expo push token with the backend once the user is authenticated and
 * has granted permission, and un-registers it at sign-out. Best-effort by design: no permission,
 * no EAS project, or a simulator (where `getExpoPushTokenAsync` throws) simply skips registration.
 * The token is never logged.
 */
export function usePushRegistration() {
  const { status } = useSession();
  const registeredToken = useRef<string | null>(null);

  // Register on (or after) sign-in, once permission is granted.
  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;

    async function register() {
      const platform = toApiPlatform(Platform.OS);
      if (!platform) return;
      try {
        const settings = await Notifications.getPermissionsAsync();
        let granted =
          settings.granted ||
          settings.ios?.status ===
            Notifications.IosAuthorizationStatus.PROVISIONAL;
        if (!granted && settings.canAskAgain) {
          granted = (await Notifications.requestPermissionsAsync()).granted;
        }
        if (!granted || cancelled) return; // permission-denied → graceful no-op

        const projectId = easProjectId();
        const { data: token } = await Notifications.getExpoPushTokenAsync(
          projectId ? { projectId } : undefined,
        );
        if (!token || cancelled || registeredToken.current === token) return;

        await apiClient.POST("/api/me/devices", {
          body: { token, platform, appVersion },
        });
        registeredToken.current = token;
      } catch {
        // No EAS project / simulator / offline — skip silently (never surface the token).
      }
    }

    void register();
    return () => {
      cancelled = true;
    };
  }, [status]);

  // Re-register when the OS rotates the token (still authenticated).
  useEffect(() => {
    const subscription = Notifications.addPushTokenListener((event) => {
      const token = event.data;
      const platform = toApiPlatform(Platform.OS);
      if (
        status !== "authenticated" ||
        !token ||
        !platform ||
        registeredToken.current === token
      ) {
        return;
      }
      apiClient
        .POST("/api/me/devices", { body: { token, platform, appVersion } })
        .then(() => {
          registeredToken.current = token;
        })
        .catch(() => {
          /* best-effort */
        });
    });
    return () => subscription.remove();
  }, [status]);

  // Un-register at sign-out so a shared device stops receiving the previous user's pushes.
  useEffect(() => {
    if (status !== "anonymous" || !registeredToken.current) return;
    const token = registeredToken.current;
    registeredToken.current = null;
    apiClient.DELETE("/api/me/devices", { body: { token } }).catch(() => {
      /* best-effort */
    });
  }, [status]);
}
