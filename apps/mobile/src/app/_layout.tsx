import { SessionProvider, useSession } from "@ager/auth";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { LoadingScreen } from "@/components/loading-screen";
import { useOnboardingGate } from "@/features/auth/use-onboarding-gate";
import { sessionController } from "@/lib/auth/session";
import { createQueryClient } from "@/lib/query/client";
import { ThemeProvider, useAppFonts } from "@/theme";

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
            <SessionProvider controller={sessionController}>
              <RootNavigator />
            </SessionProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/**
 * Session gate. Holds the native splash until fonts + the restored session are ready, then
 * routes: anonymous → the auth stack; authenticated with no interests → onboarding;
 * otherwise → the feed tabs. The onboarding gate runs only when authenticated, and the
 * authenticated route groups sit behind the session guard.
 */
function RootNavigator() {
  const [fontsLoaded, fontError] = useAppFonts();
  const { status } = useSession();
  const authenticated = status === "authenticated";
  const gate = useOnboardingGate(authenticated);

  const shellReady = (fontsLoaded || fontError) && status !== "loading";
  const gateReady = !authenticated || gate.resolved;

  useEffect(() => {
    if (shellReady) SplashScreen.hideAsync();
  }, [shellReady]);

  if (!shellReady) return null; // native splash while fonts + session load
  if (!gateReady) return <LoadingScreen />; // themed loader while the onboarding gate resolves

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={authenticated && !gate.needsOnboarding}>
          <Stack.Screen name="(tabs)" />
        </Stack.Protected>
        <Stack.Protected guard={authenticated && gate.needsOnboarding}>
          <Stack.Screen name="onboarding" />
        </Stack.Protected>
        <Stack.Protected guard={status === "anonymous"}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
