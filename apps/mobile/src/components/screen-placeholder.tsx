import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { t } from "@/i18n/i18n";
import { useTheme } from "@/theme";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

/**
 * Shared placeholder rendered by every tab in M1. Uses the theme (colors, dp spacing/
 * radius, brand fonts) and the safe-area inset so the scaffold already looks coherent.
 * Feature PRs replace each screen's body with real content.
 */
export function ScreenPlaceholder({
  icon,
  title,
}: {
  icon: IoniconName;
  title: string;
}) {
  const theme = useTheme();

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.background }]}
      edges={["top", "bottom"]}
    >
      <View
        style={[
          styles.center,
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
          <Ionicons name={icon} size={40} color={theme.colors.primary} />
        </View>

        <Text
          style={{
            color: theme.colors.foreground,
            fontFamily: theme.fonts.serifBold,
            fontSize: theme.fontSize.h2,
          }}
        >
          {title}
        </Text>

        <Text
          style={{
            color: theme.colors.accent,
            fontFamily: theme.fonts.sansSemibold,
            fontSize: theme.fontSize.small,
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          {t("Common.comingSoon")}
        </Text>

        <Text
          style={[
            styles.body,
            {
              color: theme.colors.mutedForeground,
              fontFamily: theme.fonts.sans,
              fontSize: theme.fontSize.body,
              lineHeight: theme.fontSize.body * theme.lineHeight.normal,
            },
          ]}
        >
          {t("Common.placeholderBody")}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    textAlign: "center",
    maxWidth: 320,
  },
});
