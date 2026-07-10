import { QueryClient } from "@tanstack/react-query";

/**
 * App-wide TanStack Query client. Conservative defaults for a mobile feed reader: data is
 * fresh for a minute, and failed requests retry twice. Feature PRs tune per-query options.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        retry: 2,
        refetchOnWindowFocus: false,
      },
    },
  });
}
