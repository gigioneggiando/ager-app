import type { FeedItem } from "@ager/api-client";
import { useSession } from "@ager/auth";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FeedCard } from "@/components/feed/feed-card";
import { FeedCardActions } from "@/components/feed/feed-card-actions";
import { FeedModeSelector } from "@/components/feed/feed-mode-selector";
import { MessageState } from "@/components/states/message-state";
import { dedupeFeedItems, feedMeta } from "@/features/feed/feed-cache";
import { DEFAULT_FEED_MODE, type FeedMode } from "@/features/feed/modes";
import { useFeed } from "@/features/feed/use-feed";
import { useInterests } from "@/features/interests/use-interests";
import { useOpenArticle } from "@/features/interactions/use-interaction";
import { t } from "@/i18n/i18n";
import { useTheme } from "@/theme";

export default function FeedScreen() {
  const theme = useTheme();
  const { status } = useSession();
  const [mode, setMode] = useState<FeedMode>(DEFAULT_FEED_MODE);
  const openArticle = useOpenArticle();
  const { data: interests } = useInterests();

  const {
    data,
    isPending,
    isError,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useFeed(mode);

  const items = useMemo(() => dedupeFeedItems(data?.pages), [data?.pages]);
  const { feedMode, recommenderVersion } = feedMeta(data?.pages);

  const renderItem = useCallback(
    ({ item }: { item: FeedItem }) => (
      <FeedCard
        item={item}
        feedMode={feedMode}
        recommenderVersion={recommenderVersion}
        onOpen={() => {
          void openArticle(item);
        }}
        actions={
          item.articleId != null ? (
            <FeedCardActions
              articleId={item.articleId}
              url={item.url || item.canonicalUrl || ""}
              title={item.title ?? ""}
              topics={item.topics ?? []}
              sourceId={item.sourceId}
              sourceName={item.sourceName}
              interests={interests}
            />
          ) : undefined
        }
      />
    ),
    [feedMode, recommenderVersion, openArticle, interests],
  );

  const header = (
    <View style={{ gap: theme.spacing.sm, paddingBottom: theme.spacing.md }}>
      <Text
        style={{
          color: theme.colors.foreground,
          fontFamily: theme.fonts.serifBold,
          fontSize: theme.fontSize.h1,
        }}
      >
        {t("Feed.heading")}
      </Text>
      <FeedModeSelector value={mode} onChange={setMode} />
      <Text
        style={{
          color: theme.colors.mutedForeground,
          fontFamily: theme.fonts.sans,
          fontSize: theme.fontSize.caption,
        }}
      >
        {t(`Feed.modes.${mode}.help`)}
      </Text>
      {status !== "authenticated" ? (
        <Text
          style={{
            color: theme.colors.mutedForeground,
            fontFamily: theme.fonts.sans,
            fontSize: theme.fontSize.caption,
          }}
        >
          {t("Feed.modeAnonNote")}
        </Text>
      ) : null}
    </View>
  );

  const empty = isPending ? (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  ) : isError ? (
    <MessageState
      icon="alert-circle-outline"
      title={t("Feed.list.errorTitle")}
      description={t("Feed.list.errorDescription")}
      tint={theme.colors.destructive}
      action={
        <Pressable
          accessibilityRole="button"
          onPress={() => void refetch()}
          style={[
            styles.retry,
            { borderColor: theme.colors.border, borderRadius: theme.radius.md },
          ]}
        >
          <Text
            style={{
              color: theme.colors.foreground,
              fontFamily: theme.fonts.sansSemibold,
              fontSize: theme.fontSize.small,
            }}
          >
            {t("Feed.list.retry")}
          </Text>
        </Pressable>
      }
    />
  ) : (
    <MessageState
      icon="file-tray-outline"
      title={t("Feed.list.emptyTitle")}
      description={t("Feed.list.emptyDescription")}
    />
  );

  const footer = isFetchingNextPage ? (
    <View style={styles.footer}>
      <ActivityIndicator color={theme.colors.primary} />
    </View>
  ) : items.length > 0 && !hasNextPage ? (
    <View style={styles.footer}>
      <Text
        style={{
          color: theme.colors.mutedForeground,
          fontFamily: theme.fonts.sansMedium,
          fontSize: theme.fontSize.small,
          textAlign: "center",
        }}
      >
        {t("Feed.list.caughtUpTitle")}
      </Text>
    </View>
  ) : null;

  return (
    <SafeAreaView
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
      edges={["top"]}
    >
      <FlatList
        data={items}
        keyExtractor={(item, index) =>
          String(item.articleId ?? `item-${index}`)
        }
        renderItem={renderItem}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ListFooterComponent={footer}
        contentContainerStyle={{
          padding: theme.spacing.md,
          gap: theme.spacing.md,
        }}
        onEndReachedThreshold={0.6}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isPending}
            onRefresh={() => void refetch()}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { minHeight: 320, alignItems: "center", justifyContent: "center" },
  footer: { paddingVertical: 24, alignItems: "center" },
  retry: { borderWidth: 1, paddingHorizontal: 16, paddingVertical: 10 },
});
