import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import type { HideOption } from "@/features/feed/hide-options";
import { t } from "@/i18n/i18n";
import { useTheme } from "@/theme";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

function optionLabel(option: HideOption): string {
  if (option.kind === "mute-topic") {
    return t("Actions.hideTopic", { topic: option.topic });
  }
  if (option.kind === "mute-source") {
    return t("Actions.hideSource", {
      source: option.source || t("Actions.thisSource"),
    });
  }
  return t(`Actions.${option.labelKey}`);
}

function optionIcon(option: HideOption): IoniconName {
  return option.kind === "reason" ? "flag-outline" : "volume-mute-outline";
}

/**
 * "Cosa non ti interessa?" sheet shown when Hide is tapped. Picking a reason tags the
 * DISCARD; a "mute topic/source" option escalates to a feed-wide mute. "Just hide" commits
 * a plain DISCARD; dismissing keeps the article (see FeedCardActions).
 */
export function HideReasonSheet({
  visible,
  options,
  onSelect,
  onJustHide,
  onClose,
}: {
  visible: boolean;
  options: HideOption[];
  onSelect: (option: HideOption) => void;
  onJustHide: () => void;
  onClose: () => void;
}) {
  const theme = useTheme();

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text
        style={{
          color: theme.colors.foreground,
          fontFamily: theme.fonts.sansSemibold,
          fontSize: theme.fontSize.body,
          marginBottom: theme.spacing.sm,
        }}
      >
        {t("Actions.discardReasonHeading")}
      </Text>

      <View style={{ gap: 2 }}>
        {options.map((option, index) => (
          <Pressable
            key={`${option.kind}-${index}`}
            accessibilityRole="button"
            onPress={() => onSelect(option)}
            style={({ pressed }) => [
              styles.row,
              { backgroundColor: pressed ? theme.colors.muted : "transparent" },
            ]}
          >
            <Ionicons
              name={optionIcon(option)}
              size={18}
              color={theme.colors.mutedForeground}
            />
            <Text
              style={{
                color: theme.colors.foreground,
                fontFamily: theme.fonts.sans,
                fontSize: theme.fontSize.body,
              }}
            >
              {optionLabel(option)}
            </Text>
          </Pressable>
        ))}

        <Pressable
          accessibilityRole="button"
          onPress={onJustHide}
          style={({ pressed }) => [
            styles.row,
            {
              backgroundColor: pressed ? theme.colors.muted : "transparent",
              borderTopColor: theme.colors.border,
              borderTopWidth: StyleSheet.hairlineWidth,
              marginTop: 4,
            },
          ]}
        >
          <Ionicons
            name="eye-off-outline"
            size={18}
            color={theme.colors.foreground}
          />
          <Text
            style={{
              color: theme.colors.foreground,
              fontFamily: theme.fonts.sansMedium,
              fontSize: theme.fontSize.body,
            }}
          >
            {t("Actions.hideOnly")}
          </Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
});
