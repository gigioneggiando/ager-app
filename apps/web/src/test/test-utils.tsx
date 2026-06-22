import type { ReactElement, ReactNode } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { Session } from "@/lib/session-types";
import { AuthProvider } from "@/components/auth/auth-provider";
import itMessages from "../../messages/it.json";

const DEFAULT_SESSION: Session = {
  userId: "test-user",
  email: "test@example.com",
  role: "user",
};

/**
 * Render inside the i18n + TanStack Query + Auth providers (it locale). Pass
 * `session: null` to simulate an anonymous visitor.
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper"> & { session?: Session | null },
) {
  const { session = DEFAULT_SESSION, ...renderOptions } = options ?? {};
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <NextIntlClientProvider locale="it" messages={itMessages}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider initialSession={session}>{children}</AuthProvider>
        </QueryClientProvider>
      </NextIntlClientProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}
