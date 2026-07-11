import type { NotificationsPage } from "@ager/api-client";
import { useSession } from "@ager/auth";
import {
  type InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";

import { markAllRead, markOneRead, unreadCountOf } from "./notification-cache";

export const NOTIFICATIONS_KEY = ["notifications"] as const;
const PAGE_LIMIT = 20;

/** The notifications inbox — cursor-paginated, authed-only (anonymous browsers see nothing). */
export function useNotifications() {
  const { status } = useSession();
  return useInfiniteQuery({
    queryKey: NOTIFICATIONS_KEY,
    enabled: status === "authenticated",
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }): Promise<NotificationsPage> => {
      const { data, error } = await apiClient.GET("/api/me/notifications", {
        params: { query: { limit: PAGE_LIMIT, cursor: pageParam } },
      });
      if (error || !data) throw new Error("notifications_unavailable");
      return data;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

/** Unread count for the tab badge — reads the shared inbox cache. */
export function useUnreadCount(): number {
  const { data } = useNotifications();
  return unreadCountOf(data);
}

export function useMarkRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { response } = await apiClient.PATCH(
        "/api/me/notifications/{id}/read",
        { params: { path: { id } } },
      );
      if (!response.ok) throw new Error("mark_read_failed");
    },
    onMutate: async (id: number) => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_KEY });
      const previous =
        queryClient.getQueryData<InfiniteData<NotificationsPage>>(
          NOTIFICATIONS_KEY,
        );
      queryClient.setQueryData<InfiniteData<NotificationsPage>>(
        NOTIFICATIONS_KEY,
        (data) => markOneRead(data, id),
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(NOTIFICATIONS_KEY, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
    },
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { response } = await apiClient.POST(
        "/api/me/notifications/read-all",
      );
      if (!response.ok) throw new Error("mark_all_failed");
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_KEY });
      const previous =
        queryClient.getQueryData<InfiniteData<NotificationsPage>>(
          NOTIFICATIONS_KEY,
        );
      queryClient.setQueryData<InfiniteData<NotificationsPage>>(
        NOTIFICATIONS_KEY,
        (data) => markAllRead(data),
      );
      return { previous };
    },
    onError: (_err, _v, context) => {
      if (context?.previous) {
        queryClient.setQueryData(NOTIFICATIONS_KEY, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
    },
  });
}
