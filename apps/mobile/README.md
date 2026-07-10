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
    _layout.tsx            # providers + session gate (auth / onboarding / tabs)
    (auth)/                # sign-in stack (email → OTP)
    (tabs)/                # Feed (real) · Search · Saved · Account
  components/              # shared UI (feed card, why-shown, states, …)
  features/
    feed/                  # modes, feed-cache helpers, useFeed, open-at-source
    interactions/          # postInteraction, useOpenArticle (OPENED_EXTERNAL)
    auth/                  # onboarding gate, sign-out
  theme/                   # @ager/shared tokens → dp adapter, colors, fonts, useTheme()
  lib/                     # api client, query client, safe-url, relative-time
  i18n/                    # expo-localization + i18n-js; default locale `it`, plus `en`
```

## Feed (M3)

Link-first feed on the Feed tab: cursor-paginated `useInfiniteQuery` over `GET /api/feed`
(6 ranking modes), pull-to-refresh, infinite scroll, and loading/empty/error/caught-up
states. The card never renders an article body — tapping a headline opens the publisher via
`expo-web-browser` (a `safeUrl` http(s) guard applies) and fires `OPENED_EXTERNAL`, the
primary link-first signal.

**Card actions (M3b):** Save (`SAVE` → default list, optimistic), Hide (opens a bottom sheet
with §11.2 reasons + "mute topic/source" escalation; optimistic removal from the feed cache;
picking a reason posts `DISCARD`, a mute posts to `muted-interests`/`muted-sources`), and
Share (RN `Share` + `SHARE`).

## Browsing & search (M4a)

Feed + Search browse **anonymously** (the backend serves a cold-start feed); Saved + Account
require a session and show a sign-in prompt when anonymous. Personal actions (Save / Hide /
Mute) route anonymous users to the sign-in modal via `requireAuth` (with return); open-at-
source + Share stay available.

**Search** (Search tab): free-text (`GET /api/articles/search`) or by tag
(`GET /api/articles/tags/{tag}/search`), browse-by-tag chips (`GET /api/articles/tags`),
infinite pagination, and empty/error states. Results reuse the feed card; since a search
result carries no URL, tapping it fetches the article detail and opens at source.

## Reading lists & mutes (M4b)

**Reading lists** (Saved tab, `/api/me/reading-lists`): your lists (default pinned first) →
list detail (items as feed cards, remove is optimistic) → create / delete a list, and an
"add to a list" picker on the feed card (`SAVE` still auto-files to the default list; the
picker chooses a specific one). **Rename isn't offered — the API has no rename op.**

**Mute manager** (Account → Muted topics & sources, `/api/me/muted-interests` +
`/api/me/muted-sources`): lists the muted topics + sources with optimistic un-mute (which
also widens the feed).

## Account · stats · settings (M5a)

**Account** (auth-gated): email; **export data** (`GET /api/me/export` → written to a file
and shared via the OS sheet; 429 = once-a-day); **delete account** (explicit confirm →
`DELETE /api/me` → sign-out → back to the anonymous feed); sign-out; and entries to Stats +
Settings. **Stats** (`GET /api/me/stats`): reading-variety KPIs (total, source diversity,
top-topic share, by type) over 7d / 14d / 30d windows, with loading/empty/error.
**Settings**: theme **light / dark / system** (the `@ager/shared` dark palette is now wired,
so dark actually renders), language it/en (live), mute-manager link, and a notifications
placeholder.

## Interests & onboarding (M5b)

**Interests editor** (`/interests`, from the feed) — the taxonomy grouped by macro topic
(`GET /api/interests`), pre-selected from `GET /api/me/interests`, saved via
`POST /api/me/interests` (needs ≥1). **Onboarding** reconnects the M2 gate: after sign-in a
new user (no interests) is routed to `/onboarding` (the same picker, with skip) → feed; an
existing user goes straight to the feed. The **suggested-interests nudge** (F2,
`/api/me/suggested-interests`) shows on the feed with optimistic confirm / dismiss.

## Push notifications (M6)

App-side push, auth-gated end to end (anonymous users never register a token or see an inbox).

- **Device registration** (`features/push/use-push-registration.ts`): once authenticated, the
  app requests notification permission, mints an Expo push token
  (`getExpoPushTokenAsync`), and upserts it with `POST /api/me/devices`
  (`{ token, platform, appVersion }`). It re-registers when the OS rotates the token and
  `DELETE /api/me/devices` at sign-out. Best-effort by design: permission-denied, no EAS
  project, or a simulator simply skips registration. **The token is never logged.**
- **Inbox** (`/notifications`, from Account): `GET /api/me/notifications`
  (cursor-paginated + `unreadCount`) as an infinite list with read state; tap marks read
  (`PATCH …/{id}/read`) and "Mark all" (`POST …/read-all`), both **optimistic**; an unread
  badge shows on the Account tab and the Account row. Tapping a suggested-interest
  notification deep-links to the interests editor.
- **Reception** (`features/push/use-push-listeners.ts`): a foreground arrival refreshes the
  inbox/badge; a tap (background or cold start, via `getLastNotificationResponseAsync`)
  deep-links from the payload `data` (`{ type, interestId }`) through Expo Router. The pure
  routing + cache logic is unit-tested (`features/notifications/*.test.ts`).

**Real delivery needs app-side credentials — out of scope for this PR.** End-to-end pushes
require an EAS project (`projectId`) plus **FCM** (Android) and an **APNs key** (iOS)
configured on the Expo project. In Expo Go / a simulator you can exercise permission,
registration, the inbox screen and deep-linking, but **not** actual push delivery.

## Manual verification (device) — pending

No simulator on the Windows dev box, so these need a device / simulator run:

- **Auth (M2):** OTP round-trip on the real API; token persists across restart; expired
  access auto-refreshes; sign-out clears secure storage.
- **Feed (M3a):** feed loads and scrolls (infinite); pull-to-refresh; mode switch re-ranks;
  tapping a card opens the publisher and records `OPENED_EXTERNAL`.
- **Actions (M3b):** Save toggles the icon and records `SAVE`; Hide removes the card and the
  reason/mute sheet commits `DISCARD`/mute; Share opens the OS sheet and records `SHARE`.
- **Browsing (M4a):** Feed + Search work signed out; a personal action routes to sign-in and
  returns; Saved/Account show the sign-in prompt; search (text + tag) returns results and a
  result opens the publisher.
- **Lists & mutes (M4b):** create/delete a list; open a list and remove an item; "add to a
  list" picker saves to the chosen list; un-mute a topic/source from the mute manager.
- **Account/stats/settings (M5a):** export saves + shares a JSON; delete asks to confirm →
  signs out → anonymous feed; stats show per-window KPIs; settings switch theme (incl. dark)
  and language, live.
- **Interests/onboarding (M5b):** a new user is routed to onboarding → picks interests →
  feed; the editor pre-selects current interests and saves; the suggestions nudge
  confirms/dismisses.
- **Push (M6):** grant permission after sign-in and confirm the device registers (real EAS
  build); the inbox lists notifications with an unread badge; tap marks read and "Mark all"
  clears the badge; a suggested-interest tap opens the interests editor; a push received in
  foreground refreshes the inbox, and a tap from background/killed deep-links to the target.
  (Delivery itself needs the EAS/FCM/APNs setup above.)

## Known placeholders

- **App icon & splash** are the Expo template defaults — replace with Ager brand assets.
- **Theme / language prefs** apply live but aren't persisted across launches yet (shared
  prefs store is a later PR).
- **Notifications**: the inbox + push registration/reception ship in M6, but the Settings
  **notifications toggle** is still a placeholder (no server-side preference yet), and real
  push delivery needs the app-side EAS/FCM/APNs credentials (see “Push notifications”).
- **Interests editor / onboarding** land in M5b (M2's onboarding placeholder becomes the real
  editor).
