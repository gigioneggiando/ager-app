import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useTheme } from "@/theme";

/** Full-screen themed loader shown while the session / onboarding gate resolves. */
export function LoadingScreen() {
  const theme = useTheme();
  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
