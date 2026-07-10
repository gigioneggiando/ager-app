import type { ReadingListItemsPage, ReadingListsPage } from "@ager/api-client";
import {
  type InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { postInteraction } from "@/features/interactions/post-interaction";
import { apiClient } from "@/lib/api/client";

import { removeListItem } from "./reading-lists-cache";

export const LISTS_QUERY_KEY = ["reading-lists"] as const;
export const listItemsKey = (listId: number) =>
  ["reading-list", listId, "items"] as const;

/** The caller's reading lists (default "Salvati" pinned first by the UI). */
export function useReadingLists() {
  return useQuery({
    queryKey: LISTS_QUERY_KEY,
    queryFn: async (): Promise<ReadingListsPage> => {
      const { data, error } = await apiClient.GET("/api/me/reading-lists");
      if (error || !data) throw new Error("lists_unavailable");
      return data;
    },
  });
}

/** Infinite-scroll items (article previews) for one list. */
export function useReadingListItems(listId: number) {
  return useInfiniteQuery({
    queryKey: listItemsKey(listId),
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }): Promise<ReadingListItemsPage> => {
      const { data, error } = await apiClient.GET(
        "/api/me/reading-lists/{readingListId}/items",
        {
          params: {
            path: { readingListId: listId },
            query: { cursor: pageParam },
          },
        },
      );
      if (error || !data) throw new Error("items_unavailable");
      return data;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useCreateList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; description?: string }) => {
      const { data, error } = await apiClient.POST("/api/me/reading-lists", {
        body: {
          name: input.name,
          description: input.description,
          visibility: 0,
        },
      });
      if (error || !data) throw new Error("create_failed");
      return data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: LISTS_QUERY_KEY }),
  });
}

export function useDeleteList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (listId: number) => {
      const { response } = await apiClient.DELETE(
        "/api/me/reading-lists/{readingListId}",
        { params: { path: { readingListId: listId } } },
      );
      if (!response.ok) throw new Error("delete_failed");
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: LISTS_QUERY_KEY }),
  });
}

/** Add an article to a specific list; also fires the SAVE signal. */
export async function addArticleToList(
  listId: number,
  articleId: number,
  note?: string,
): Promise<void> {
  const { response } = await apiClient.POST(
    "/api/me/reading-lists/{readingListId}/items",
    {
      params: { path: { readingListId: listId } },
      body: { articleId, note: note?.trim() || undefined },
    },
  );
  if (response.status >= 500) throw new Error("add_failed");
  await postInteraction(articleId, "SAVE");
}

export function useAddToList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { listId: number; articleId: number; note?: string }) =>
      addArticleToList(vars.listId, vars.articleId, vars.note),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({
        queryKey: listItemsKey(vars.listId),
      });
      void queryClient.invalidateQueries({ queryKey: LISTS_QUERY_KEY });
    },
  });
}

/** Remove an item from a list, optimistically (restores on error, reconciles on settle). */
export function useRemoveItem(listId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (articleId: number) => {
      const { response } = await apiClient.DELETE(
        "/api/me/reading-lists/{readingListId}/items/{articleId}",
        { params: { path: { readingListId: listId, articleId } } },
      );
      if (!response.ok) throw new Error("remove_failed");
    },
    onMutate: async (articleId: number) => {
      await queryClient.cancelQueries({ queryKey: listItemsKey(listId) });
      const previous = queryClient.getQueryData<
        InfiniteData<ReadingListItemsPage>
      >(listItemsKey(listId));
      queryClient.setQueryData<InfiniteData<ReadingListItemsPage>>(
        listItemsKey(listId),
        (data) => removeListItem(data, articleId),
      );
      return { previous };
    },
    onError: (_err, _articleId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(listItemsKey(listId), context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: listItemsKey(listId) });
      void queryClient.invalidateQueries({ queryKey: LISTS_QUERY_KEY });
    },
  });
}
