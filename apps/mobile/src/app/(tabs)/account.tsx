import { useSession } from "@ager/auth";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useSignOut } from "@/features/auth/use-sign-out";
import { t } from "@/i18n/i18n";
import { useTheme } from "@/theme";

/**
 * Minimal account screen for M2 — shows who's signed in and a sign-out action. The full
 * account + stats experience is M5.
 */
export default function AccountScreen() {
  const theme = useTheme();
  const { user } = useSession();
  const signOut = useSignOut();

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.background }]}
      edges={["top", "bottom"]}
    >
      <View
        style={[
          styles.content,
          { padding: theme.spacing.xl, gap: theme.spacing.lg },
        ]}
      >
        <Text
          style={{
            color: theme.colors.foreground,
            fontFamily: theme.fonts.serifBold,
            fontSize: theme.fontSize.h1,
          }}
        >
          {t("Tabs.account")}
        </Text>

        {user?.email ? (
          <View style={{ gap: theme.spacing.xs }}>
            <Text
              style={{
                color: theme.colors.mutedForeground,
                fontFamily: theme.fonts.sans,
                fontSize: theme.fontSize.small,
              }}
            >
              {t("Account.signedInAs")}
            </Text>
            <Text
              style={{
                color: theme.colors.foreground,
                fontFamily: theme.fonts.sansMedium,
                fontSize: theme.fontSize.body,
              }}
            >
              {user.email}
            </Text>
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          onPress={signOut}
          style={({ pressed }) => [
            styles.signOut,
            {
              borderColor: theme.colors.border,
              borderRadius: theme.radius.md,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Ionicons
            name="log-out-outline"
            size={20}
            color={theme.colors.destructive}
          />
          <Text
            style={{
              color: theme.colors.destructive,
              fontFamily: theme.fonts.sansSemibold,
              fontSize: theme.fontSize.body,
            }}
          >
            {t("Account.signOut")}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flex: 1, justifyContent: "flex-start" },
  signOut: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    paddingVertical: 14,
  },
});
