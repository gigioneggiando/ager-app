/**
 * Shared zod schemas / types — front-end-only concerns that are NOT part of the backend
 * contract. Anything that mirrors an API shape MUST come from `@ager/api-client`
 * (generated from swagger.json) so it cannot drift. Keep this file for UI/client state
 * (locale, theme, feed-mode selection, etc.).
 *
 * Placeholder for Prompt 0 — real schemas land in later prompts.
 */
import { z } from "zod";

export const LOCALES = ["it", "en"] as const;
export const DEFAULT_LOCALE = "it" satisfies (typeof LOCALES)[number];

export const localeSchema = z.enum(LOCALES);
export type Locale = z.infer<typeof localeSchema>;

export const themePreferenceSchema = z.enum(["light", "dark", "system"]);
export type ThemePreference = z.infer<typeof themePreferenceSchema>;
