import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps, ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/theme";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

/** Themed centered state (empty / error / caught-up) with an optional action. */
export function MessageState({
  icon,
  title,
  description,
  action,
  tint,
}: {
  icon: IoniconName;
  title: string;
  description?: string;
  action?: ReactNode;
  tint?: string;
}) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.container,
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
        <Ionicons name={icon} size={30} color={tint ?? theme.colors.primary} />
      </View>

      <Text
        style={{
          color: theme.colors.foreground,
          fontFamily: theme.fonts.serifBold,
          fontSize: theme.fontSize.h3,
          textAlign: "center",
        }}
      >
        {title}
      </Text>

      {description ? (
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
          {description}
        </Text>
      ) : null}

      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 320,
  },
  iconWrap: { alignItems: "center", justifyContent: "center" },
});
