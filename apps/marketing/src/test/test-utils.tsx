import type { ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";

import itMessages from "../../messages/it.json";

/** Render inside the i18n provider (it locale, real catalog). */
export function renderWithIntl(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper"> & { locale?: "it" | "en" },
) {
  const { locale = "it", ...renderOptions } = options ?? {};
  return render(ui, {
    wrapper: ({ children }) => (
      <NextIntlClientProvider locale={locale} messages={itMessages}>
        {children}
      </NextIntlClientProvider>
    ),
    ...renderOptions,
  });
}
