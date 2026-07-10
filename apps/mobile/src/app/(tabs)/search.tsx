import type { ArticleSearchResult } from "@ager/api-client";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FeedCard } from "@/components/feed/feed-card";
import { FeedCardActions } from "@/components/feed/feed-card-actions";
import { MessageState } from "@/components/states/message-state";
import { useOpenArticleById } from "@/features/interactions/use-interaction";
import { searchResultToFeedItem } from "@/features/search/search-result";
import {
  type SearchQuery,
  useArticleSearch,
  useTags,
} from "@/features/search/use-search";
import { t } from "@/i18n/i18n";
import { useTheme } from "@/theme";

export default function SearchScreen() {
  const theme = useTheme();
  const [text, setText] = useState("");
  const [query, setQuery] = useState<SearchQuery | null>(null);
  const openArticleById = useOpenArticleById();

  const { data: tags } = useTags();
  const {
    data,
    isPending,
    isError,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useArticleSearch(query);

  const items = useMemo(
    () => data?.pages.flatMap((page) => page.items ?? []) ?? [],
    [data?.pages],
  );

  function submitText() {
    const term = text.trim();
    setQuery(term ? { kind: "text", term } : null);
  }

  function pickTag(slug: string) {
    setText("");
    setQuery({ kind: "tag", term: slug });
  }

  function clear() {
    setText("");
    setQuery(null);
  }

  const renderItem = useCallback(
    ({ item }: { item: ArticleSearchResult }) => (
      <FeedCard
        item={searchResultToFeedItem(item)}
        onOpen={() => {
          if (item.articleId != null) void openArticleById(item.articleId);
        }}
        actions={
          item.articleId != null ? (
            <FeedCardActions
              articleId={item.articleId}
              url=""
              title={item.title ?? ""}
              interests={undefined}
            />
          ) : undefined
        }
      />
    ),
    [openArticleById],
  );

  // Body: no query → browse-by-tag; querying → loading; error; empty; else results.
  let empty: ReactNode = null;
  if (!query) {
    empty = (
      <View style={{ gap: theme.spacing.md }}>
        <Text
          style={{
            color: theme.colors.mutedForeground,
            fontFamily: theme.fonts.sansMedium,
            fontSize: theme.fontSize.small,
          }}
        >
          {t("Search.browseByTag")}
        </Text>
        <View style={styles.tagWrap}>
          {(tags ?? []).map((tag) =>
            tag.slug ? (
              <Pressable
                key={tag.slug}
                accessibilityRole="button"
                onPress={() => pickTag(tag.slug as string)}
                style={[
                  styles.tag,
                  {
                    backgroundColor: theme.colors.secondary,
                    borderRadius: theme.radius.lg,
                  },
                ]}
              >
                <Text
                  style={{
                    color: theme.colors.secondaryForeground,
                    fontFamily: theme.fonts.sansMedium,
                    fontSize: theme.fontSize.small,
                  }}
                >
                  {tag.name || tag.slug}
                </Text>
              </Pressable>
            ) : null,
          )}
        </View>
      </View>
    );
  } else if (isPending || (isFetching && items.length === 0)) {
    empty = (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  } else if (isError) {
    empty = (
      <MessageState
        icon="alert-circle-outline"
        title={t("Search.errorTitle")}
        description={t("Search.errorDescription")}
        tint={theme.colors.destructive}
      />
    );
  } else {
    empty = (
      <MessageState
        icon="search-outline"
        title={t("Search.emptyTitle")}
        description={t("Search.emptyDescription")}
      />
    );
  }

  return (
    <SafeAreaView
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
      edges={["top"]}
    >
      <View style={[styles.searchBar, { padding: theme.spacing.md }]}>
        <View
          style={[
            styles.inputWrap,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.md,
            },
          ]}
        >
          <Ionicons
            name="search"
            size={18}
            color={theme.colors.mutedForeground}
          />
          <TextInput
            value={text}
            onChangeText={setText}
            onSubmitEditing={submitText}
            placeholder={t("Search.placeholder")}
            placeholderTextColor={theme.colors.mutedForeground}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            style={[
              styles.input,
              {
                color: theme.colors.foreground,
                fontFamily: theme.fonts.sans,
                fontSize: theme.fontSize.body,
              },
            ]}
          />
          {query || text ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("Search.clear")}
              onPress={clear}
            >
              <Ionicons
                name="close-circle"
                size={18}
                color={theme.colors.mutedForeground}
              />
            </Pressable>
          ) : null}
        </View>
        {query?.kind === "tag" ? (
          <Text
            style={{
              color: theme.colors.mutedForeground,
              fontFamily: theme.fonts.sans,
              fontSize: theme.fontSize.caption,
              marginTop: theme.spacing.xs,
            }}
          >
            {t("Search.taggedWith", { tag: query.term })}
          </Text>
        ) : null}
      </View>

      <FlatList
        data={items}
        keyExtractor={(item, index) =>
          String(item.articleId ?? `item-${index}`)
        }
        renderItem={renderItem}
        ListEmptyComponent={empty}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={styles.footer}>
              <ActivityIndicator color={theme.colors.primary} />
            </View>
          ) : null
        }
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.md,
          paddingBottom: theme.spacing.md,
          gap: theme.spacing.md,
        }}
        keyboardShouldPersistTaps="handled"
        onEndReachedThreshold={0.6}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  searchBar: { paddingBottom: 4 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: { flex: 1, padding: 0 },
  tagWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: { paddingHorizontal: 14, paddingVertical: 8 },
  center: { minHeight: 240, alignItems: "center", justifyContent: "center" },
  footer: { paddingVertical: 24, alignItems: "center" },
});
