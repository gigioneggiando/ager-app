import { useSession } from "@ager/auth";
import type { SuggestedInterest } from "@ager/api-client";
import {
  type QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";

import { MY_INTERESTS_QUERY_KEY } from "./use-interests";

export const SUGGESTED_INTERESTS_KEY = ["suggested-interests"] as const;

/** Implicit-learning candidates past the notify threshold — the "widen your feed?" nudge.
 *  Authed-only, so anonymous browsers never fire a doomed 401. */
export function useSuggestedInterests() {
  const { status } = useSession();
  return useQuery({
    queryKey: SUGGESTED_INTERESTS_KEY,
    enabled: status === "authenticated",
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<SuggestedInterest[]> => {
      const { data, error } = await apiClient.GET(
        "/api/me/suggested-interests",
      );
      if (error || !data) throw new Error("suggested_unavailable");
      return data;
    },
  });
}

function optimisticRemove(queryClient: QueryClient, interestId: number) {
  const previous = queryClient.getQueryData<SuggestedInterest[]>(
    SUGGESTED_INTERESTS_KEY,
  );
  queryClient.setQueryData<SuggestedInterest[]>(
    SUGGESTED_INTERESTS_KEY,
    (list) => (list ?? []).filter((s) => s.interestId !== interestId),
  );
  return previous;
}

/** Promote a suggestion to an explicit interest (optimistic removal from the nudge). */
export function useConfirmSuggestedInterest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (interestId: number) => {
      const { response } = await apiClient.POST(
        "/api/me/suggested-interests/{interestId}/confirm",
        { params: { path: { interestId } } },
      );
      if (!response.ok) throw new Error("confirm_failed");
    },
    onMutate: (interestId: number) => ({
      previous: optimisticRemove(queryClient, interestId),
    }),
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(SUGGESTED_INTERESTS_KEY, ctx.previous);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MY_INTERESTS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: SUGGESTED_INTERESTS_KEY });
    },
  });
}

/** Dismiss a suggestion (optimistic removal from the nudge). */
export function useDismissSuggestedInterest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (interestId: number) => {
      const { response } = await apiClient.POST(
        "/api/me/suggested-interests/{interestId}/dismiss",
        { params: { path: { interestId } } },
      );
      if (!response.ok) throw new Error("dismiss_failed");
    },
    onMutate: (interestId: number) => ({
      previous: optimisticRemove(queryClient, interestId),
    }),
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(SUGGESTED_INTERESTS_KEY, ctx.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: SUGGESTED_INTERESTS_KEY });
    },
  });
}
