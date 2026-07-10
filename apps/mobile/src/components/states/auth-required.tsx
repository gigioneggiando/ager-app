import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SIGN_IN_ROUTE } from "@/features/auth/use-require-auth";
import { t } from "@/i18n/i18n";
import { useTheme } from "@/theme";

/** Shown on session-gated tabs (Saved / Account) when the user is browsing anonymously. */
export function AuthRequired({ description }: { description?: string }) {
  const theme = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.background }]}
      edges={["top", "bottom"]}
    >
      <View
        style={[
          styles.content,
          { padding: theme.spacing.xl, gap: theme.spacing.md },
        ]}
      >
        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor: theme.colors.secondary,
              borderRadius: theme.radius.image,
              padding: theme.spacing.lg,
            },
          ]}
        >
          <Ionicons
            name="lock-closed-outline"
            size={30}
            color={theme.colors.primary}
          />
        </View>

        <Text
          style={{
            color: theme.colors.foreground,
            fontFamily: theme.fonts.serifBold,
            fontSize: theme.fontSize.h2,
            textAlign: "center",
          }}
        >
          {t("AuthPrompt.title")}
        </Text>

        <Text
          style={{
            color: theme.colors.mutedForeground,
            fontFamily: theme.fonts.sans,
            fontSize: theme.fontSize.body,
            lineHeight: theme.fontSize.body * theme.lineHeight.normal,
            textAlign: "center",
            maxWidth: 320,
          }}
        >
          {description ?? t("AuthPrompt.description")}
        </Text>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push(SIGN_IN_ROUTE)}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: theme.colors.primary,
              borderRadius: theme.radius.md,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Text
            style={{
              color: theme.colors.primaryForeground,
              fontFamily: theme.fonts.sansSemibold,
              fontSize: theme.fontSize.body,
            }}
          >
            {t("AuthPrompt.signIn")}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flex: 1, alignItems: "center", justifyContent: "center" },
  iconWrap: { alignItems: "center", justifyContent: "center" },
  button: {
    marginTop: 8,
    paddingHorizontal: 28,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});
