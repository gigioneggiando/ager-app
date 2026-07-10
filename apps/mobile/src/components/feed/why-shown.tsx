import type { FeedScoreBreakdown } from "@ager/api-client";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { t } from "@/i18n/i18n";
import { useTheme } from "@/theme";

const DIMENSIONS = [
  "recency",
  "topicMatch",
  "sourceDiversity",
  "topicVariety",
  "clusterProminence",
] as const;

function toPercent(value: number | undefined): number {
  return Math.max(0, Math.min(100, Math.round((value ?? 0) * 100)));
}

interface WhyShownProps {
  score?: number;
  breakdown?: FeedScoreBreakdown;
  feedMode?: string | null;
  recommenderVersion?: string | null;
}

/**
 * Transparency affordance ("Perché lo vedo?") — collapsible. Explains, in plain language,
 * why an item is ranked: the score breakdown (0–1 → bars) plus feed mode and recommender
 * version. Read-only (mirrors the web WhyShown).
 */
export function WhyShown({
  score,
  breakdown,
  feedMode,
  recommenderVersion,
}: WhyShownProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((v) => !v)}
        style={styles.trigger}
      >
        <Ionicons
          name="help-circle-outline"
          size={15}
          color={theme.colors.link}
        />
        <Text
          style={{
            color: theme.colors.link,
            fontFamily: theme.fonts.sansMedium,
            fontSize: theme.fontSize.caption,
          }}
        >
          {t("Feed.why.trigger")}
        </Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={14}
          color={theme.colors.link}
        />
      </Pressable>

      {open ? (
        <View
          style={[
            styles.panel,
            {
              backgroundColor: theme.colors.muted,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.md,
              gap: theme.spacing.sm,
            },
          ]}
        >
          <Text style={metaText(theme)}>{t("Feed.why.intro")}</Text>

          {breakdown
            ? DIMENSIONS.map((dim) => {
                const value = toPercent(breakdown[dim]);
                return (
                  <View key={dim} style={{ gap: 4 }}>
                    <View style={styles.row}>
                      <Text
                        style={{
                          color: theme.colors.foreground,
                          fontFamily: theme.fonts.sansMedium,
                          fontSize: theme.fontSize.caption,
                        }}
                      >
                        {t(`Feed.why.dimensions.${dim}.label`)}
                      </Text>
                      <Text style={metaText(theme)}>{value}%</Text>
                    </View>
                    <View
                      style={[
                        styles.barTrack,
                        { backgroundColor: theme.colors.border },
                      ]}
                    >
                      <View
                        style={{
                          width: `${value}%`,
                          height: "100%",
                          backgroundColor: theme.colors.accent,
                          borderRadius: 999,
                        }}
                      />
                    </View>
                    <Text style={metaText(theme)}>
                      {t(`Feed.why.dimensions.${dim}.help`)}
                    </Text>
                  </View>
                );
              })
            : null}

          <View
            style={[
              styles.meta,
              { borderTopColor: theme.colors.border, gap: 4 },
            ]}
          >
            {typeof score === "number" ? (
              <MetaRow
                label={t("Feed.why.score")}
                value={`${toPercent(score)}%`}
              />
            ) : null}
            {feedMode ? (
              <MetaRow label={t("Feed.why.feedMode")} value={feedMode} />
            ) : null}
            {recommenderVersion ? (
              <MetaRow
                label={t("Feed.why.version")}
                value={recommenderVersion}
              />
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <Text style={metaText(theme)}>{label}</Text>
      <Text
        style={{
          color: theme.colors.foreground,
          fontFamily: theme.fonts.sans,
          fontSize: theme.fontSize.caption,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function metaText(theme: ReturnType<typeof useTheme>) {
  return {
    color: theme.colors.mutedForeground,
    fontFamily: theme.fonts.sans,
    fontSize: theme.fontSize.caption,
  };
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
  },
  panel: { marginTop: 6, padding: 12, borderWidth: 1 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  barTrack: { height: 6, width: "100%", borderRadius: 999, overflow: "hidden" },
  meta: { borderTopWidth: 1, paddingTop: 8 },
});
