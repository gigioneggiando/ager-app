"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReadingList } from "@ager/api-client";

import { postInteraction } from "@/features/interactions/use-interaction";
import type { Paged, ReadingListItem } from "./types";

const LISTS_KEY = ["reading-lists"] as const;
const itemsKey = (listId: number) => ["reading-list", listId, "items"] as const;

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`request_failed_${res.status}`);
  return (await res.json()) as T;
}

export function useReadingLists() {
  return useQuery({
    queryKey: LISTS_KEY,
    queryFn: () => getJson<Paged<ReadingList>>("/api/me/reading-lists"),
  });
}

export function useReadingListItems(listId: number) {
  return useQuery({
    queryKey: itemsKey(listId),
    queryFn: () =>
      getJson<Paged<ReadingListItem>>(
        `/api/me/reading-lists/${listId}/items`,
      ),
  });
}

export function useCreateList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; description?: string }) => {
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
      const previous = queryClient.getQueryData<Paged<ReadingListItem>>(
        itemsKey(listId),
      );
      if (previous) {
        queryClient.setQueryData<Paged<ReadingListItem>>(itemsKey(listId), {
          ...previous,
          items: previous.items.filter((i) => i.articleId !== articleId),
        });
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

/**
 * Save an article: ensure a default reading list exists (create it if missing), add the
 * article to it, and record the SAVE interaction alongside.
 */
export function useSaveArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { articleId: number; defaultListName: string }) => {
      const lists = await getJson<Paged<ReadingList>>("/api/me/reading-lists");
      let target = lists.items.find((l) => l.name === input.defaultListName);

      if (!target) {
        const created = await fetch("/api/me/reading-lists", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name: input.defaultListName }),
        });
        if (!created.ok) throw new Error("create_failed");
        const { id } = (await created.json()) as { id: number };
        target = {
          id,
          name: input.defaultListName,
        } as ReadingList;
      }

      const added = await fetch(
        `/api/me/reading-lists/${target.id}/items`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ articleId: input.articleId }),
        },
      );
      // 201 created or 409/400 if already present — treat non-5xx as "saved".
      if (added.status >= 500) throw new Error("add_failed");

      await postInteraction(input.articleId, "SAVE");
      return { listId: target.id };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: LISTS_KEY });
    },
  });
}
