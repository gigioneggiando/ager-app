import type { FeedItem } from "@ager/api-client";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { WhyShown } from "@/components/feed/why-shown";
import { t } from "@/i18n/i18n";
import { relativeTime } from "@/lib/relative-time";
import { safeUrl } from "@/lib/safe-url";
import { useTheme } from "@/theme";

const MAX_TOPICS = 3;

function timeLabel(iso?: string): string {
  const rel = relativeTime(iso);
  if (!rel) return "";
  return rel.unit === "now"
    ? t("Feed.card.time.now")
    : t(`Feed.card.time.${rel.unit}`, { value: rel.value });
}

interface FeedCardProps {
  item: FeedItem;
  feedMode?: string | null;
  recommenderVersion?: string | null;
  /** Open the publisher (fires OPENED_EXTERNAL). */
  onOpen: () => void;
  /** Optional actions row (Save / Hide / Share) rendered in the footer — M3b. */
  actions?: ReactNode;
}

/**
 * The reusable RN feed card, populated from FeedItemDto. LINK-FIRST: it never renders an
 * article body — only title, excerpt, source, hotlinked image, topics and the "why shown"
 * transparency panel. Tapping the image or headline opens the publisher.
 */
export function FeedCard({
  item,
  feedMode,
  recommenderVersion,
  onOpen,
  actions,
}: FeedCardProps) {
  const theme = useTheme();

  const title = item.title?.trim() || t("Feed.card.untitled");
  const imageSrc = safeUrl(item.imageUrl ?? undefined);
  const topics = (item.topics ?? []).slice(0, MAX_TOPICS);
  const time = timeLabel(item.publishedAt);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.lg,
        },
      ]}
    >
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${title} — ${t("Feed.card.openExternal")}`}
        onPress={onOpen}
      >
        {imageSrc ? (
          <Image
            source={{ uri: imageSrc }}
            style={[styles.image, { borderRadius: theme.radius.image }]}
            contentFit="cover"
            transition={150}
          />
        ) : (
          <View
            style={[
              styles.image,
              styles.placeholder,
              {
                backgroundColor: theme.colors.muted,
                borderRadius: theme.radius.image,
              },
            ]}
          >
            <Ionicons
              name="newspaper-outline"
              size={30}
              color={theme.colors.primary}
            />
          </View>
        )}
      </Pressable>

      <View style={{ padding: theme.spacing.md, gap: theme.spacing.sm }}>
        {topics.length > 0 ? (
          <View style={styles.topicRow}>
            {topics.map((topic) => (
              <View
                key={topic}
                style={[
                  styles.badge,
                  {
                    backgroundColor: theme.colors.secondary,
                    borderRadius: theme.radius.sm,
                  },
                ]}
              >
                <Text
                  style={{
                    color: theme.colors.secondaryForeground,
                    fontFamily: theme.fonts.sansMedium,
                    fontSize: theme.fontSize.caption,
                  }}
                >
                  {topic}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        <Pressable accessibilityRole="link" onPress={onOpen}>
          <Text
            style={{
              color: theme.colors.primary,
              fontFamily: theme.fonts.serifBold,
              fontSize: theme.fontSize.h4,
              lineHeight: theme.fontSize.h4 * theme.lineHeight.snug,
            }}
          >
            {title}{" "}
            <Ionicons
              name="open-outline"
              size={14}
              color={theme.colors.mutedForeground}
            />
          </Text>
        </Pressable>

        {item.excerpt ? (
          <Text
            numberOfLines={3}
            style={{
              color: theme.colors.foreground,
              fontFamily: theme.fonts.sans,
              fontSize: theme.fontSize.small,
              lineHeight: theme.fontSize.small * theme.lineHeight.normal,
            }}
          >
            {item.excerpt}
          </Text>
        ) : null}

        <View style={styles.metaRow}>
          {item.sourceName ? (
            <Text
              style={{
                color: theme.colors.foreground,
                fontFamily: theme.fonts.sansMedium,
                fontSize: theme.fontSize.caption,
              }}
            >
              {item.sourceName}
            </Text>
          ) : null}
          {item.sourceType ? (
            <Text style={metaDim(theme)}>· {item.sourceType}</Text>
          ) : null}
          {time ? <Text style={metaDim(theme)}>· {time}</Text> : null}
        </View>

        <WhyShown
          score={item.score}
          breakdown={item.scoreBreakdown}
          feedMode={feedMode}
          recommenderVersion={recommenderVersion}
        />

        {actions ? (
          <View
            style={[styles.actions, { borderTopColor: theme.colors.border }]}
          >
            {actions}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function metaDim(theme: ReturnType<typeof useTheme>) {
  return {
    color: theme.colors.mutedForeground,
    fontFamily: theme.fonts.sans,
    fontSize: theme.fontSize.caption,
  };
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, overflow: "hidden" },
  image: { width: "100%", aspectRatio: 16 / 9 },
  placeholder: { alignItems: "center", justifyContent: "center" },
  topicRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 3 },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 2,
  },
});
