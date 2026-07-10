import type { ReadingStats } from "@ager/api-client";
import { Stack } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MessageState } from "@/components/states/message-state";
import {
  DEFAULT_STATS_WINDOW,
  STATS_WINDOWS,
  type StatsWindow,
  toPercent,
  useStats,
} from "@/features/stats/use-stats";
import { t } from "@/i18n/i18n";
import { useTheme } from "@/theme";

function Kpi({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.kpi,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md,
        },
      ]}
    >
      <Text
        style={{
          color: theme.colors.foreground,
          fontFamily: theme.fonts.serifBold,
          fontSize: theme.fontSize.h2,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          color: theme.colors.foreground,
          fontFamily: theme.fonts.sansMedium,
          fontSize: theme.fontSize.small,
        }}
      >
        {label}
      </Text>
      {hint ? (
        <Text
          style={{
            color: theme.colors.mutedForeground,
            fontFamily: theme.fonts.sans,
            fontSize: theme.fontSize.caption,
          }}
        >
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

export default function StatsScreen() {
  const theme = useTheme();
  const [window, setWindow] = useState<StatsWindow>(DEFAULT_STATS_WINDOW);
  const { data, isPending, isError } = useStats(window);

  const byType = Object.entries(
    (data as ReadingStats | undefined)?.byType ?? {},
  );
  const isEmpty = !isPending && !isError && (data?.total ?? 0) === 0;

  return (
    <SafeAreaView
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
      edges={["top", "bottom"]}
    >
      <Stack.Screen options={{ headerShown: true, title: t("Stats.title") }} />

      <View style={{ padding: theme.spacing.md, gap: theme.spacing.md }}>
        <Text
          style={{
            color: theme.colors.mutedForeground,
            fontFamily: theme.fonts.sans,
            fontSize: theme.fontSize.small,
          }}
        >
          {t("Stats.subtitle")}
        </Text>
        <View style={styles.windows}>
          {STATS_WINDOWS.map((w) => {
            const active = w === window;
            return (
              <Pressable
                key={w}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setWindow(w)}
                style={[
                  styles.windowChip,
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
                <Text
                  style={{
                    color: active
                      ? theme.colors.primaryForeground
                      : theme.colors.mutedForeground,
                    fontFamily: theme.fonts.sansSemibold,
                    fontSize: theme.fontSize.small,
                  }}
                >
                  {t(`Stats.window.${w}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {isPending ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : isError ? (
        <MessageState
          icon="alert-circle-outline"
          title={t("Stats.errorTitle")}
          tint={theme.colors.destructive}
        />
      ) : isEmpty ? (
        <MessageState
          icon="stats-chart-outline"
          title={t("Stats.emptyTitle")}
          description={t("Stats.emptyDescription")}
        />
      ) : (
        <View
          style={{ paddingHorizontal: theme.spacing.md, gap: theme.spacing.md }}
        >
          <View style={styles.kpiRow}>
            <Kpi label={t("Stats.total")} value={String(data?.total ?? 0)} />
            <Kpi
              label={t("Stats.sourceDiversity")}
              value={`${toPercent(data?.distinctSourceRatio)}%`}
              hint={t("Stats.sourceDiversityHint")}
            />
            <Kpi
              label={t("Stats.topTopicShare")}
              value={`${toPercent(data?.topTopicShare)}%`}
              hint={t("Stats.topTopicShareHint")}
            />
          </View>

          {byType.length > 0 ? (
            <View style={{ gap: theme.spacing.xs }}>
              <Text
                style={{
                  color: theme.colors.mutedForeground,
                  fontFamily: theme.fonts.sansSemibold,
                  fontSize: theme.fontSize.small,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                {t("Stats.byType")}
              </Text>
              {byType.map(([type, count]) => (
                <View key={type} style={styles.typeRow}>
                  <Text
                    style={{
                      color: theme.colors.foreground,
                      fontFamily: theme.fonts.sans,
                      fontSize: theme.fontSize.body,
                    }}
                  >
                    {type}
                  </Text>
                  <Text
                    style={{
                      color: theme.colors.foreground,
                      fontFamily: theme.fonts.sansSemibold,
                      fontSize: theme.fontSize.body,
                    }}
                  >
                    {count}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  windows: { flexDirection: "row", gap: 8 },
  windowChip: { borderWidth: 1, paddingHorizontal: 16, paddingVertical: 8 },
  kpiRow: { flexDirection: "row", gap: 8 },
  kpi: { flex: 1, gap: 4, borderWidth: 1, padding: 12 },
  typeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
});
