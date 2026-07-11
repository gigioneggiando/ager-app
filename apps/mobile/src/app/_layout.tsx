import { SessionProvider, useSession } from "@ager/auth";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { usePushListeners } from "@/features/push/use-push-listeners";
import { usePushRegistration } from "@/features/push/use-push-registration";
import { LocaleProvider } from "@/i18n/locale-context";
import { sessionController } from "@/lib/auth/session";
import { createQueryClient } from "@/lib/query/client";
import { ThemeProvider, useAppFonts, useTheme } from "@/theme";

// Initialize the runtime locale (side effect) before any screen renders.
import "@/i18n/i18n";

// Keep the splash screen visible until fonts + session are ready.
SplashScreen.preventAutoHideAsync();

const queryClient = createQueryClient();

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <LocaleProvider>
              <SessionProvider controller={sessionController}>
                <RootNavigator />
              </SessionProvider>
            </LocaleProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/**
 * De-gated shell (M4a): Feed + Search browse anonymously (the backend serves a cold-start
 * feed), so the tabs are always reachable. Saved / Account require a session (they render an
 * auth prompt when anonymous), and personal actions route to the sign-in modal via
 * `requireAuth`. The splash is still held until the session is restored so auth-dependent
 * screens don't flash.
 */
function RootNavigator() {
  const [fontsLoaded, fontError] = useAppFonts();
  const { status } = useSession();
  const theme = useTheme();
  const ready = (fontsLoaded || fontError) && status !== "loading";

  // Push: register the device token when authenticated, and route notification taps.
  usePushRegistration();
  usePushListeners();

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null; // native splash while fonts + session load

  return (
    <>
      <StatusBar style={theme.scheme === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(auth)" options={{ presentation: "modal" }} />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
