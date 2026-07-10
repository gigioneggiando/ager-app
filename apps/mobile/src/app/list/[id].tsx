import type { ArticleInList } from "@ager/api-client";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FeedCard } from "@/components/feed/feed-card";
import { MessageState } from "@/components/states/message-state";
import { useOpenArticle } from "@/features/interactions/use-interaction";
import {
  flattenListItems,
  listItemToFeedItem,
} from "@/features/reading-lists/reading-lists-cache";
import {
  useReadingListItems,
  useReadingLists,
  useRemoveItem,
} from "@/features/reading-lists/use-reading-lists";
import { t } from "@/i18n/i18n";
import { useTheme } from "@/theme";

export default function ReadingListScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const listId = Number(id);
  const openArticle = useOpenArticle();

  const { data: lists } = useReadingLists();
  const listName =
    lists?.items?.find((l) => l.id === listId)?.name ?? t("Tabs.saved");

  const {
    data,
    isPending,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useReadingListItems(listId);
  const removeItem = useRemoveItem(listId);

  const items = useMemo(() => flattenListItems(data), [data]);

  const renderItem = useCallback(
    ({ item }: { item: ArticleInList }) => (
      <FeedCard
        item={listItemToFeedItem(item)}
        onOpen={() => {
          void openArticle(listItemToFeedItem(item));
        }}
        actions={
          item.articleId != null ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("Lists.removeItem")}
              onPress={() => removeItem.mutate(item.articleId as number)}
              style={styles.remove}
            >
              <Ionicons
                name="trash-outline"
                size={18}
                color={theme.colors.destructive}
              />
              <Text
                style={{
                  color: theme.colors.destructive,
                  fontFamily: theme.fonts.sansMedium,
                  fontSize: theme.fontSize.caption,
                }}
              >
                {t("Lists.removeItem")}
              </Text>
            </Pressable>
          ) : undefined
        }
      />
    ),
    [openArticle, removeItem, theme],
  );

  return (
    <SafeAreaView
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
      edges={["top", "bottom"]}
    >
      <Stack.Screen options={{ headerShown: true, title: listName }} />
      <FlatList
        data={items}
        keyExtractor={(item, index) =>
          String(item.articleId ?? `item-${index}`)
        }
        renderItem={renderItem}
        contentContainerStyle={{
          padding: theme.spacing.md,
          gap: theme.spacing.md,
        }}
        onEndReachedThreshold={0.6}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
        }}
        ListEmptyComponent={
          isPending ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : isError ? (
            <MessageState
              icon="alert-circle-outline"
              title={t("Lists.errorTitle")}
              tint={theme.colors.destructive}
            />
          ) : (
            <MessageState
              icon="bookmark-outline"
              title={t("Lists.emptyItemsTitle")}
              description={t("Lists.emptyItemsDescription")}
            />
          )
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={styles.footer}>
              <ActivityIndicator color={theme.colors.primary} />
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { minHeight: 300, alignItems: "center", justifyContent: "center" },
  footer: { paddingVertical: 24, alignItems: "center" },
  remove: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },
});
