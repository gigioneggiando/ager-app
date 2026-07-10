import type { Notification } from "@ager/api-client";
import { useSession } from "@ager/auth";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AuthRequired } from "@/components/states/auth-required";
import { MessageState } from "@/components/states/message-state";
import {
  flattenNotifications,
  unreadCountOf,
} from "@/features/notifications/notification-cache";
import { routeForNotification } from "@/features/notifications/notification-routing";
import {
  useMarkAllRead,
  useMarkRead,
  useNotifications,
} from "@/features/notifications/use-notifications";
import { t } from "@/i18n/i18n";
import { relativeTime } from "@/lib/relative-time";
import { useTheme } from "@/theme";

function timeLabel(iso?: string): string {
  const rel = relativeTime(iso);
  if (!rel) return "";
  return rel.unit === "now"
    ? t("Feed.card.time.now")
    : t(`Feed.card.time.${rel.unit}`, { value: rel.value });
}

/** Header action to mark every notification read; hidden when the inbox is already clear. */
function MarkAllButton() {
  const theme = useTheme();
  const { data } = useNotifications();
  const markAll = useMarkAllRead();
  if (unreadCountOf(data) === 0) return null;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => markAll.mutate()}
      hitSlop={8}
      style={{ paddingHorizontal: 4 }}
    >
      <Text
        style={{
          color: theme.colors.primary,
          fontFamily: theme.fonts.sansSemibold,
          fontSize: theme.fontSize.small,
        }}
      >
        {t("Notifications.markAllRead")}
      </Text>
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { status } = useSession();
  const {
    data,
    isPending,
    isError,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useNotifications();
  const markRead = useMarkRead();

  const items = useMemo(() => flattenNotifications(data), [data]);

  if (status !== "authenticated") {
    return <AuthRequired description={t("Notifications.authDescription")} />;
  }

  function handlePress(notification: Notification) {
    if (notification.id != null && !notification.isRead) {
      markRead.mutate(notification.id);
    }
    const route = routeForNotification(notification);
    if (route) router.push(route);
  }

  return (
    <SafeAreaView
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
      edges={["bottom"]}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: t("Notifications.title"),
          headerRight: () => <MarkAllButton />,
        }}
      />

      <FlatList
        data={items}
        keyExtractor={(item, index) => String(item.id ?? index)}
        contentContainerStyle={{
          padding: theme.spacing.md,
          gap: theme.spacing.sm,
        }}
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListEmptyComponent={
          isPending ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : isError ? (
            <MessageState
              icon="alert-circle-outline"
              title={t("Notifications.errorTitle")}
              description={t("Notifications.errorDescription")}
              tint={theme.colors.destructive}
            />
          ) : (
            <MessageState
              icon="notifications-off-outline"
              title={t("Notifications.emptyTitle")}
              description={t("Notifications.emptyDescription")}
            />
          )
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator
              color={theme.colors.primary}
              style={{ marginVertical: theme.spacing.md }}
            />
          ) : null
        }
        renderItem={({ item }) => {
          const unread = !item.isRead;
          return (
            <Pressable
              accessibilityRole="button"
              onPress={() => handlePress(item)}
              style={({ pressed }) => [
                styles.row,
                {
                  backgroundColor: pressed
                    ? theme.colors.muted
                    : unread
                      ? theme.colors.secondary
                      : theme.colors.card,
                  borderColor: theme.colors.border,
                  borderRadius: theme.radius.md,
                },
              ]}
            >
              <Ionicons
                name={
                  routeForNotification(item)
                    ? "sparkles-outline"
                    : "notifications-outline"
                }
                size={20}
                color={
                  unread ? theme.colors.primary : theme.colors.mutedForeground
                }
              />
              <View style={styles.rowText}>
                <Text
                  style={{
                    color: theme.colors.foreground,
                    fontFamily: unread
                      ? theme.fonts.sansSemibold
                      : theme.fonts.sans,
                    fontSize: theme.fontSize.body,
                  }}
                >
                  {item.content ?? t("Notifications.fallbackContent")}
                </Text>
                <Text
                  style={{
                    color: theme.colors.mutedForeground,
                    fontFamily: theme.fonts.sans,
                    fontSize: theme.fontSize.caption,
                  }}
                >
                  {timeLabel(item.createdAt)}
                </Text>
              </View>
              {unread ? (
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: theme.colors.primary },
                  ]}
                  accessibilityLabel={t("Notifications.unread")}
                />
              ) : null}
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { minHeight: 320, alignItems: "center", justifyContent: "center" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    padding: 14,
  },
  rowText: { flex: 1, gap: 2 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
