import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  useConfirmSuggestedInterest,
  useDismissSuggestedInterest,
  useSuggestedInterests,
} from "@/features/interests/use-suggested-interests";
import { t } from "@/i18n/i18n";
import { useTheme } from "@/theme";

/** "Widen your feed?" nudge (F2) — self-hides when there are no suggestions. */
export function SuggestedInterests() {
  const theme = useTheme();
  const { data } = useSuggestedInterests();
  const confirm = useConfirmSuggestedInterest();
  const dismiss = useDismissSuggestedInterest();

  if (!data || data.length === 0) return null;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.secondary,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md,
          gap: theme.spacing.sm,
        },
      ]}
    >
      <Text
        style={{
          color: theme.colors.foreground,
          fontFamily: theme.fonts.sansSemibold,
          fontSize: theme.fontSize.body,
        }}
      >
        {t("Suggested.title")}
      </Text>
      <Text
        style={{
          color: theme.colors.mutedForeground,
          fontFamily: theme.fonts.sans,
          fontSize: theme.fontSize.small,
        }}
      >
        {t("Suggested.subtitle")}
      </Text>

      {data.map((suggestion) =>
        suggestion.interestId != null ? (
          <View key={suggestion.interestId} style={styles.row}>
            <Text
              style={{
                flex: 1,
                color: theme.colors.foreground,
                fontFamily: theme.fonts.sansMedium,
                fontSize: theme.fontSize.body,
              }}
              numberOfLines={1}
            >
              {suggestion.slug ?? String(suggestion.interestId)}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("Suggested.add")}
              onPress={() => confirm.mutate(suggestion.interestId as number)}
              style={[
                styles.add,
                {
                  borderColor: theme.colors.primary,
                  borderRadius: theme.radius.sm,
                },
              ]}
            >
              <Ionicons name="add" size={16} color={theme.colors.primary} />
              <Text
                style={{
                  color: theme.colors.primary,
                  fontFamily: theme.fonts.sansSemibold,
                  fontSize: theme.fontSize.small,
                }}
              >
                {t("Suggested.add")}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("Suggested.dismiss")}
              hitSlop={8}
              onPress={() => dismiss.mutate(suggestion.interestId as number)}
            >
              <Ionicons
                name="close"
                size={18}
                color={theme.colors.mutedForeground}
              />
            </Pressable>
          </View>
        ) : null,
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, padding: 14 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  add: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
});
