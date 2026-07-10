import { LOCALES, type Locale } from "@ager/shared";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { i18n, resolveDeviceLocale } from "./i18n";

export { LOCALES, type Locale } from "@ager/shared";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

/**
 * Reactive app locale. Seeds from the device (M1), then lets Settings override it live —
 * changing i18n's locale + re-rendering the tree so every `t()` re-resolves. Persistence
 * across launches lands with the shared preferences store (a later PR).
 */
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() =>
    resolveDeviceLocale(),
  );

  const setLocale = useCallback((next: Locale) => {
    i18n.locale = next;
    setLocaleState(next);
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, setLocale }),
    [locale, setLocale],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within a <LocaleProvider>.");
  }
  return ctx;
}

export const LOCALE_OPTIONS = LOCALES;
