import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useSignOut } from "@/features/auth/use-sign-out";
import { t } from "@/i18n/i18n";
import { useTheme } from "@/theme";

/**
 * Onboarding placeholder. A signed-in user with no interests lands here. The real interests
 * editor is M5 — for now this is the next-step placeholder, with a sign-out escape hatch so
 * the user is never trapped.
 */
export default function OnboardingScreen() {
  const theme = useTheme();
  const signOut = useSignOut();

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
            name="sparkles-outline"
            size={40}
            color={theme.colors.accent}
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
          {t("Onboarding.title")}
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
          {t("Onboarding.body")}
        </Text>

        <Pressable
          accessibilityRole="button"
          onPress={signOut}
          style={styles.signOut}
        >
          <Text
            style={{
              color: theme.colors.mutedForeground,
              fontFamily: theme.fonts.sansMedium,
              fontSize: theme.fontSize.small,
            }}
          >
            {t("Onboarding.signOut")}
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
  signOut: { marginTop: 8, padding: 8 },
});
