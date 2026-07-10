# @ager/mobile

The Ager native app — Expo (React Native), iOS + Android from one codebase. This is the
**M1 scaffold**: foundation and placeholder screens only. Features land in later PRs
(auth · feed · lists/mute/search · account/stats · push).

Built on Expo Router (file-based routing) + TypeScript strict. It reuses the monorepo's
shared logic and contracts — never web UI:

- **`@ager/api-client`** — the typed, framework-agnostic API client, wrapped for RN with a
  base URL + bearer middleware (`src/lib/api/client.ts`).
- **`@ager/shared`** — brand color tokens + zod schemas. Radius / spacing / typography are
  CSS strings, so a small rem/px → dp adapter (`src/theme/scale.ts`) makes them native.

## Prerequisites

- Node 22 (`.nvmrc` at the repo root) and pnpm 11 (`corepack`/npm — see the root README).
- The [Expo Go](https://expo.dev/go) app on a physical device, **or** an Android emulator /
  iOS simulator. iOS simulators require macOS + Xcode; on Windows use Expo Go or Android.

## Install

Always install from the **repo root** so the workspace links resolve:

```bash
pnpm install          # at ager-app/ root
```

## Run

```bash
# from the repo root
pnpm --filter @ager/mobile start      # Metro + QR code for Expo Go
pnpm --filter @ager/mobile android    # open on Android emulator / device
pnpm --filter @ager/mobile ios        # open on iOS simulator (macOS only)

# or from apps/mobile/
pnpm start
```

Then scan the QR code with Expo Go, or press `a` / `i` in the terminal to launch an
emulator/simulator. Metro is configured for the pnpm monorepo (`metro.config.js`) so edits
to `packages/*` hot-reload here too.

## Environment

Only `EXPO_PUBLIC_*` variables are inlined into the app bundle. Copy `.env.example` to
`.env` to point the app at a backend:

| Variable                   | Purpose                        | Default                       |
| -------------------------- | ------------------------------ | ----------------------------- |
| `EXPO_PUBLIC_API_BASE_URL` | Backend base URL the app calls | `https://api.agerculture.com` |

The native client authenticates with a plain `Authorization: Bearer <token>` header — no
cookies, no CSRF. The token store is a placeholder in M1 (`setTokenProvider`); the real
secure-store-backed session arrives in M2.

## Checks (what CI runs)

```bash
pnpm --filter @ager/mobile lint        # eslint (eslint-config-expo)
pnpm --filter @ager/mobile typecheck   # tsc --noEmit (strict)
pnpm --filter @ager/mobile test        # jest-expo
```

Turborepo globs `apps/*`, so these run automatically in the monorepo CI alongside web and
marketing.

## EAS builds are separate

Native binaries (`eas build`) and store submission are **not** part of `turbo build` or CI.
`turbo build` intentionally skips this package (it has no `build` script). EAS is wired up
in a later PR.

## Structure

```
src/
  app/                     # Expo Router routes
    _layout.tsx            # providers: gesture-handler, safe-area, Query, Theme; font gate
    (tabs)/                # tab shell — Feed · Search · Saved · Account (placeholders)
  components/              # shared UI (ScreenPlaceholder)
  theme/                   # @ager/shared tokens → dp adapter, colors, fonts, useTheme()
  lib/
    api/                   # @ager/api-client wrapper (base URL + bearer middleware)
    query/                 # TanStack Query client
  i18n/                    # expo-localization + i18n-js; default locale `it`, plus `en`
```

## Known placeholders (M1)

- **App icon & splash** are the Expo template defaults — replace with Ager brand assets.
- **Dark palette** is not signed off yet: `src/theme/colors.ts` wires light and leaves a
  clean `dark` seam (`useTheme()` degrades any dark request to light until then).
- **Screens** are `ScreenPlaceholder`s; no feature logic.
