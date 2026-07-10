import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { MessageState } from "@/components/states/message-state";
import {
  buildSections,
  toggleInterest,
} from "@/features/interests/interest-sections";
import {
  useInterests,
  useSaveInterests,
} from "@/features/interests/use-interests";
import { t } from "@/i18n/i18n";
import { useTheme } from "@/theme";

// Soft minimum (a hint, not enforced). The backend rejects an empty set, so save needs ≥1.
const SUGGESTED_MIN = 5;

/**
 * The interest taxonomy picker — chips grouped by macro topic, with a save bar. Shared by
 * onboarding (`onSkip` shown) and the editor (pre-selected via `initialSelected`).
 */
export function InterestPicker({
  initialSelected = [],
  onSaved,
  onSkip,
  saveLabel,
  header,
}: {
  initialSelected?: number[];
  onSaved?: () => void;
  onSkip?: () => void;
  saveLabel: string;
  header?: React.ReactNode;
}) {
  const theme = useTheme();
  const { data: interests, isPending, isError } = useInterests();
  const saveInterests = useSaveInterests();
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(initialSelected),
  );

  const sections = useMemo(
    () => (interests ? buildSections(interests) : []),
    [interests],
  );

  const count = selected.size;
  const canSave = count >= 1 && !saveInterests.isPending;

  function handleSave() {
    if (!canSave) return;
    saveInterests.mutate([...selected], { onSuccess: () => onSaved?.() });
  }

  if (isPending) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }
  if (isError || !interests) {
    return (
      <MessageState
        icon="alert-circle-outline"
        title={t("Onboarding.loadError")}
        tint={theme.colors.destructive}
      />
    );
  }

  return (
    <View style={styles.flex}>
      <ScrollView
        contentContainerStyle={{
          padding: theme.spacing.md,
          gap: theme.spacing.lg,
        }}
      >
        {header}
        {sections.map((section, index) => (
          <View key={section.title || index} style={{ gap: theme.spacing.sm }}>
            {section.title ? (
              <Text
                style={{
                  color: theme.colors.primary,
                  fontFamily: theme.fonts.serifBold,
                  fontSize: theme.fontSize.h4,
                }}
              >
                {section.title}
              </Text>
            ) : null}
            <View style={styles.chips}>
              {section.items.map((interest) => {
                const active = interest.id != null && selected.has(interest.id);
                return (
                  <Pressable
                    key={interest.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() =>
                      interest.id != null &&
                      setSelected((prev) =>
                        toggleInterest(prev, interest.id as number),
                      )
                    }
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active
                          ? theme.colors.primary
                          : theme.colors.card,
                        borderColor: active
                          ? theme.colors.primary
                          : theme.colors.border,
                        borderRadius: theme.radius.lg,
                      },
                    ]}
                  >
                    {active ? (
                      <Ionicons
                        name="checkmark"
                        size={15}
                        color={theme.colors.primaryForeground}
                      />
                    ) : null}
                    <Text
                      style={{
                        color: active
                          ? theme.colors.primaryForeground
                          : theme.colors.foreground,
                        fontFamily: theme.fonts.sansMedium,
                        fontSize: theme.fontSize.small,
                      }}
                    >
                      {interest.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
        {saveInterests.isError ? (
          <Text
            style={{
              color: theme.colors.destructive,
              fontFamily: theme.fonts.sans,
              fontSize: theme.fontSize.small,
            }}
          >
            {t("Onboarding.saveError")}
          </Text>
        ) : null}
      </ScrollView>

      <View
        style={[
          styles.bar,
          {
            backgroundColor: theme.colors.background,
            borderTopColor: theme.colors.border,
          },
        ]}
      >
        <Text
          style={{
            color: theme.colors.mutedForeground,
            fontFamily: theme.fonts.sans,
            fontSize: theme.fontSize.small,
          }}
        >
          {t("Onboarding.selectedCount", { count })}
          {count < SUGGESTED_MIN
            ? ` · ${t("Onboarding.suggestMin", { min: SUGGESTED_MIN })}`
            : ""}
        </Text>
        <View style={styles.barActions}>
          {onSkip ? (
            <Pressable
              accessibilityRole="button"
              onPress={onSkip}
              style={styles.skip}
            >
              <Text
                style={{
                  color: theme.colors.mutedForeground,
                  fontFamily: theme.fonts.sansMedium,
                  fontSize: theme.fontSize.body,
                }}
              >
                {t("Onboarding.skip")}
              </Text>
            </Pressable>
          ) : null}
          <Pressable
            accessibilityRole="button"
            disabled={!canSave}
            onPress={handleSave}
            style={({ pressed }) => [
              styles.save,
              {
                backgroundColor: theme.colors.primary,
                borderRadius: theme.radius.md,
                opacity: !canSave || pressed ? 0.6 : 1,
              },
            ]}
          >
            {saveInterests.isPending ? (
              <ActivityIndicator color={theme.colors.primaryForeground} />
            ) : (
              <Text
                style={{
                  color: theme.colors.primaryForeground,
                  fontFamily: theme.fonts.sansSemibold,
                  fontSize: theme.fontSize.body,
                }}
              >
                {saveLabel}
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 240,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  bar: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    gap: 8,
  },
  barActions: { flexDirection: "row", alignItems: "center", gap: 12 },
  skip: { paddingHorizontal: 12, paddingVertical: 12 },
  save: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    minHeight: 50,
  },
});
