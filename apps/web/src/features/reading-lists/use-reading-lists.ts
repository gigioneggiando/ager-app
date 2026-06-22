"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import type {
  ArticleInList,
  ReadingListItemsPage,
  ReadingListsPage,
} from "@ager/api-client";

import { postInteraction } from "@/features/interactions/use-interaction";

const LISTS_KEY = ["reading-lists"] as const;
const itemsKey = (listId: number) => ["reading-list", listId, "items"] as const;

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`request_failed_${res.status}`);
  return (await res.json()) as T;
}

/** The caller's reading lists (default "Salvati" pinned first by the UI). */
export function useReadingLists() {
  return useQuery({
    queryKey: LISTS_KEY,
    queryFn: () => getJson<ReadingListsPage>("/api/me/reading-lists"),
  });
}

/** Infinite-scroll items (article previews) for one list. */
export function useReadingListItems(listId: number) {
  return useInfiniteQuery({
    queryKey: itemsKey(listId),
    queryFn: ({ pageParam }) =>
      getJson<ReadingListItemsPage>(
        `/api/me/reading-lists/${listId}/items${
          pageParam ? `?cursor=${encodeURIComponent(pageParam)}` : ""
        }`,
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
}

export function flattenItems(
  data: InfiniteData<ReadingListItemsPage> | undefined,
): ArticleInList[] {
  return data?.pages.flatMap((p) => p.items ?? []) ?? [];
}

/** Add an article to a specific list (raw); also fires the SAVE signal. */
export async function addArticleToList(
  listId: number,
  articleId: number,
  note?: string,
): Promise<void> {
  const res = await fetch(`/api/me/reading-lists/${listId}/items`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ articleId, note: note?.trim() || undefined }),
  });
  if (res.status >= 500) throw new Error("add_failed");
  await postInteraction(articleId, "SAVE");
}

export function useCreateList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      name: string;
      description?: string;
      visibility?: number;
    }) => {
      const res = await fetch("/api/me/reading-lists", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("create_failed");
      return (await res.json()) as { id: number };
    },
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: LISTS_KEY }),
  });
}

export function useDeleteList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (listId: number) => {
      const res = await fetch(`/api/me/reading-lists/${listId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("delete_failed");
    },
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: LISTS_KEY }),
  });
}

/** Add to a chosen list (used by the add-to-list dialog). */
export function useAddToList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { listId: number; articleId: number; note?: string }) =>
      addArticleToList(vars.listId, vars.articleId, vars.note),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: itemsKey(vars.listId) });
      void queryClient.invalidateQueries({ queryKey: LISTS_KEY });
    },
  });
}

export function useRemoveItem(listId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (articleId: number) => {
      const res = await fetch(
        `/api/me/reading-lists/${listId}/items/${articleId}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("remove_failed");
    },
    onMutate: async (articleId: number) => {
      await queryClient.cancelQueries({ queryKey: itemsKey(listId) });
      const previous = queryClient.getQueryData<
        InfiniteData<ReadingListItemsPage>
      >(itemsKey(listId));
      if (previous) {
        queryClient.setQueryData<InfiniteData<ReadingListItemsPage>>(
          itemsKey(listId),
          {
            ...previous,
            pages: previous.pages.map((page) => ({
              ...page,
              items: (page.items ?? []).filter(
                (i) => i.articleId !== articleId,
              ),
            })),
          },
        );
      }
      return { previous };
    },
    onError: (_err, _articleId, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(itemsKey(listId), ctx.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: itemsKey(listId) });
      void queryClient.invalidateQueries({ queryKey: LISTS_KEY });
    },
  });
}
