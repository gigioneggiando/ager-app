import type { Notification, NotificationsPage } from "@ager/api-client";
import type { InfiniteData } from "@tanstack/react-query";

/** Pure notification-inbox cache helpers (framework-agnostic → unit-testable). */

export function flattenNotifications(
  data: InfiniteData<NotificationsPage> | undefined,
): Notification[] {
  return data?.pages.flatMap((page) => page.items ?? []) ?? [];
}

/** Unread count (carried on each page; read from the first). */
export function unreadCountOf(
  data: InfiniteData<NotificationsPage> | undefined,
): number {
  return data?.pages[0]?.unreadCount ?? 0;
}

/** Optimistically mark one notification read, decrementing the unread count if it flipped. */
export function markOneRead(
  data: InfiniteData<NotificationsPage> | undefined,
  id: number,
): InfiniteData<NotificationsPage> | undefined {
  if (!data) return data;
  const wasUnread = flattenNotifications(data).some(
    (n) => n.id === id && !n.isRead,
  );
  const delta = wasUnread ? 1 : 0;
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      unreadCount: Math.max(0, (page.unreadCount ?? 0) - delta),
      items: (page.items ?? []).map((n) =>
        n.id === id ? { ...n, isRead: true } : n,
      ),
    })),
  };
}

/** Optimistically mark everything read (unread → 0). */
export function markAllRead(
  data: InfiniteData<NotificationsPage> | undefined,
): InfiniteData<NotificationsPage> | undefined {
  if (!data) return data;
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      unreadCount: 0,
      items: (page.items ?? []).map((n) => ({ ...n, isRead: true })),
    })),
  };
}
