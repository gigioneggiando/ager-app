import type { FeedPage, Interest } from "@ager/api-client";
import { useSession } from "@ager/auth";
import { Ionicons } from "@expo/vector-icons";
import { type InfiniteData, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Platform, Pressable, Share, StyleSheet, Text } from "react-native";

import { HideReasonSheet } from "@/components/feed/hide-reason-sheet";
import { useRequireAuth } from "@/features/auth/use-require-auth";
import { FEED_QUERY_KEY } from "@/features/feed/use-feed";
import { removeFromFeed } from "@/features/feed/feed-cache";
import {
  buildHideOptions,
  commitForOption,
  type HideCommit,
  type HideOption,
} from "@/features/feed/hide-options";
import { resolveMutableTopics } from "@/features/interests/use-interests";
import { postInteraction } from "@/features/interactions/post-interaction";
import { muteInterest, muteSource } from "@/features/mutes/use-mutes";
import { apiClient } from "@/lib/api/client";
import { t } from "@/i18n/i18n";
import { safeUrl } from "@/lib/safe-url";
import { useTheme } from "@/theme";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

function ActionButton({
  icon,
  label,
  active,
  onPress,
}: {
  icon: IoniconName;
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const color = active ? theme.colors.accent : theme.colors.mutedForeground;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          borderRadius: theme.radius.sm,
          backgroundColor: pressed ? theme.colors.muted : "transparent",
        },
      ]}
    >
      <Ionicons name={icon} size={18} color={color} />
      <Text
        style={{
          color,
          fontFamily: theme.fonts.sansMedium,
          fontSize: theme.fontSize.caption,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * Feed card actions: Save (SAVE → default list), Hide (DISCARD + §11.2 reasons / mute
 * escalation, optimistic removal), Share (RN Share + SHARE). Feed + Search browse
 * anonymously (M4a), so the personal actions (Save / Hide / Mute) route anonymous users to
 * sign-in via `requireAuth`; Share stays available and only records SHARE when signed in.
 * Never logs PII.
 */
export function FeedCardActions({
  articleId,
  url,
  title,
  topics = [],
  sourceId,
  sourceName,
  interests,
}: {
  articleId: number;
  url: string;
  title: string;
  topics?: string[];
  sourceId?: number | null;
  sourceName?: string | null;
  interests: Interest[] | undefined;
}) {
  const queryClient = useQueryClient();
  const requireAuth = useRequireAuth();
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const [saved, setSaved] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const options = useMemo<HideOption[]>(
    () =>
      buildHideOptions({
        mutableTopics: resolveMutableTopics(topics, interests),
        sourceId,
        sourceName,
      }),
    [topics, interests, sourceId, sourceName],
  );

  function handleSave() {
    if (!requireAuth()) return; // anonymous → route to sign-in
    if (saved) return;
    setSaved(true); // optimistic; SAVE auto-files to the default "Salvati" list
    void postInteraction(articleId, "SAVE");
  }

  function openHideSheet() {
    if (!requireAuth()) return; // anonymous → route to sign-in
    setSheetOpen(true);
  }

  function commit(action: HideCommit) {
    // Remove this card from every feed cache immediately (keyed by mode → match by prefix).
    queryClient.setQueriesData<InfiniteData<FeedPage>>(
      { queryKey: [FEED_QUERY_KEY] },
      (data) => removeFromFeed(data, articleId),
    );

    const markFeedStale = () =>
      void queryClient.invalidateQueries({
        queryKey: [FEED_QUERY_KEY],
        refetchType: "none", // keep the optimistic state; reconcile on the next refresh
      });

    if (action.type === "discard") {
      void postInteraction(articleId, "DISCARD", action.reason).then(
        markFeedStale,
      );
    } else if (action.type === "mute-interest") {
      void muteInterest(action.interestId).then(markFeedStale);
    } else {
      void muteSource(action.sourceId).then(markFeedStale);
    }
  }

  function handleSelect(option: HideOption) {
    setSheetOpen(false);
    commit(commitForOption(option));
  }

  function handleJustHide() {
    setSheetOpen(false);
    commit(commitForOption(null));
  }

  async function handleShare() {
    let target = safeUrl(url);
    if (!target) {
      // Search results carry no URL — resolve it from the article detail.
      const { data } = await apiClient.GET("/api/articles/{id}", {
        params: { path: { id: articleId } },
      });
      target = safeUrl(data?.url ?? data?.canonicalUrl ?? undefined);
    }
    if (!target) return;
    try {
      const result = await Share.share(
        Platform.OS === "ios"
          ? { url: target, message: title }
          : { message: `${title} ${target}` },
      );
      if (result.action === Share.sharedAction && isAuthenticated) {
        void postInteraction(articleId, "SHARE");
      }
    } catch {
      // share dialog dismissed / failed — nothing to do
    }
  }

  return (
    <>
      <ActionButton
        icon={saved ? "bookmark" : "bookmark-outline"}
        label={saved ? t("Actions.saved") : t("Actions.save")}
        active={saved}
        onPress={handleSave}
      />
      <ActionButton
        icon="eye-off-outline"
        label={t("Actions.discard")}
        onPress={openHideSheet}
      />
      <ActionButton
        icon="share-outline"
        label={t("Actions.share")}
        onPress={handleShare}
      />

      <HideReasonSheet
        visible={sheetOpen}
        options={options}
        onSelect={handleSelect}
        onJustHide={handleJustHide}
        onClose={() => setSheetOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
});
