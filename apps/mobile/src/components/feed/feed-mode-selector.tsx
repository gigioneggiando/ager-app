import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

import { FEED_MODES, type FeedMode } from "@/features/feed/modes";
import { t } from "@/i18n/i18n";
import { useTheme } from "@/theme";

/**
 * Ranking-mode control — a horizontal row of pill chips over the six recommender modes
 * (the RN-native equivalent of the web <select>). Selecting a mode re-ranks the feed
 * (the mode is part of the query key).
 */
export function FeedModeSelector({
  value,
  onChange,
}: {
  value: FeedMode;
  onChange: (mode: FeedMode) => void;
}) {
  const theme = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {FEED_MODES.map((mode) => {
        const active = mode === value;
        return (
          <Pressable
            key={mode}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(mode)}
            style={[
              styles.chip,
              {
                borderColor: active
                  ? theme.colors.primary
                  : theme.colors.border,
                backgroundColor: active
                  ? theme.colors.primary
                  : theme.colors.card,
                borderRadius: theme.radius.lg,
              },
            ]}
          >
            <Text
              style={{
                color: active
                  ? theme.colors.primaryForeground
                  : theme.colors.mutedForeground,
                fontFamily: active
                  ? theme.fonts.sansSemibold
                  : theme.fonts.sansMedium,
                fontSize: theme.fontSize.small,
              }}
            >
              {t(`Feed.modes.${mode}.label`)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingRight: 16 },
  chip: { borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
});
