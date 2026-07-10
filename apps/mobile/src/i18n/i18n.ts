import { DEFAULT_LOCALE, LOCALES, type Locale } from "@ager/shared";
import { getLocales } from "expo-localization";
import { I18n } from "i18n-js";

import en from "./messages/en.json";
import it from "./messages/it.json";

/**
 * Runtime i18n for the mobile app. Message catalogs mirror the web key style; the locale
 * set + default ('it') come from @ager/shared so web and native never drift. i18n-js
 * resolves the first supported device locale, falling back to the default.
 */
export const i18n = new I18n({ it, en });

i18n.defaultLocale = DEFAULT_LOCALE;
i18n.enableFallback = true;

/** First device language we support, else the default locale ('it'). */
export function resolveDeviceLocale(): Locale {
  const supported = new Set<string>(LOCALES);
  for (const locale of getLocales()) {
    if (locale.languageCode && supported.has(locale.languageCode)) {
      return locale.languageCode as Locale;
    }
  }
  return DEFAULT_LOCALE;
}

i18n.locale = resolveDeviceLocale();

/** Translate a key, e.g. `t("Tabs.feed")`. */
export function t(key: string, options?: Record<string, unknown>): string {
  return i18n.t(key, options);
}
