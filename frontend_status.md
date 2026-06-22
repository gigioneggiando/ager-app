# Frontend Status

Tracker for the AGER web frontend (Sprint 5). One PR per prompt; branch `feat/<topic>`
off `main`, open PR vs `main`, owner ratifies/merges. See
[`FRONTEND_DESIGN.md`](./FRONTEND_DESIGN.md) for the locked decisions.

| Prompt | Scope | Branch | Status |
| ------ | ----- | ------ | ------ |
| **PR0** | Scaffold: monorepo + Next.js web app + OpenAPI client + CI | `feat/prompt0` | ✅ Merged (#1) |
| **PR1** | Design system + app shell — official Ager brand (tokens, fonts, logo/favicon, shell, components, FeedCard, styleguide) | `feat/prompt1` | ✅ Done — PR open vs `main` |
| **PR2** | Feed — public/cold-start (`GET /api/feed` anonymous, infinite scroll, transparency) | `feat/prompt2` | ✅ Done — PR open vs `main` |
| **PR3** | Article detail + dynamic OG images + sources (via proxies) | `feat/prompt3` | ✅ Done — PR open vs `main` |
| **PR4** | Auth — OTP login, HttpOnly session + refresh + CSRF via route-handler proxy, personalized feed | `feat/prompt4` | ✅ Done — PR open vs `main` |
| **PR5** | Logged-in layer — onboarding interests + interactions + reading lists | `feat/prompt5` | ✅ Done — PR open vs `main` |
| **Interests** | Interests editor — server truth + no hard cap | `feat/prompt-interests` | ✅ Merged (#9) |
| **Lists** | Reading-list rich port — multiple lists + add-to-list dialog + default surface + 3s undo | `feat/prompt-lists` | ✅ Merged (#10) |
| **PR6** | Feed mode selector + me/stats dashboard + search (text + tag) | `feat/prompt6` | ✅ Done — PR open vs `main` |
| PR7 | Close-out — PWA, OG finalize, Lighthouse/perf, a11y pass, deploy, tag `frontend-web-v1` | — | ⬜ Not started |
| 5b | Mobile (Expo, later) | — | ⬜ Not started |

## PR0 — Scaffold ✅

Delivered:

- **Monorepo**: pnpm workspaces + Turborepo (`pnpm-workspace.yaml`, `turbo.json`), Node 22.
- **apps/web**: Next.js 16 (App Router, TS strict, ESLint flat config), Tailwind CSS v4,
  shadcn/ui (neutral base, `components.json` + `Button`), next-intl with `[locale]`
  routing (it default / en) and the Next 16 `proxy` convention. Minimal landing route at
  `/[locale]` proving build + i18n + Tailwind + a shadcn component render.
- **packages/api-client**: contract copied to `openapi/swagger.json`; `pnpm gen:api`
  regenerates the typed client (openapi-typescript) and a configured openapi-fetch client
  (`createApiClient` / `apiClient`, base URL from env). Generated output committed.
- **packages/shared**: design tokens (neutral, HSL — colors/spacing/typography/radius) +
  placeholder zod schemas (locale, theme preference).
- **Env**: `NEXT_PUBLIC_API_BASE_URL` (default `https://api.agerculture.com`) +
  `apps/web/.env.example`.
- **CI** (GitHub Actions, Node 22): `pnpm install` → `gen:api` (+ stale-check) → `lint` →
  `typecheck` → `build` → `test`.
- **Docs**: `README.md` (local dev + Vercel monorepo settings), `FRONTEND_DESIGN.md`,
  this tracker.

Local verification (all green): `pnpm lint`, `pnpm typecheck`, `pnpm build`,
`pnpm test` (3 tests passing).

Not in scope (later prompts): feed / auth / onboarding, real theming/brand colors,
deploy.

## PR1 — Design system + app shell ✅

Implements the official **Ager brand** (from `docs/brand/`).

- **Brand tokens** (one-place swap): palette as CSS variables in
  `packages/shared/styles/brand.css`, imported by `apps/web` globals via
  `@import "@ager/shared/brand.css"`; mirrored in TS at
  `packages/shared/src/tokens.ts`. shadcn semantic tokens mapped to brand
  (editorial-white bg, ink-gray fg, ager-blue primary, neutral-beige secondary/muted,
  ethical-green accent) + functional state colors (link/success/warning/error).
- **Light-first**: no dark palette shipped. Dark variant plumbing left declared but
  disabled with a TODO pending owner sign-off (brand defines no dark theme).
- **Typography**: next/font — Merriweather (serif → headings + wordmark) + Inter
  (sans → UI/body); `font-serif`/`font-sans` wired; headings default to serif.
- **Logo / favicon**: themeable `<Logo>` (symbol + Merriweather wordmark, currentColor,
  clear-space + min-size aware) built from the brand symbol; generated favicon
  (`icon.svg`) + `apple-icon.png` + public brand SVGs via
  `scripts/gen-brand-icons.mjs` (sharp). Source SVGs copied to
  `packages/shared/assets/`.
- **App shell**: locale-aware layout with sticky `Header` (logo + nav + locale switch +
  mobile menu), `Footer`, and a `Container` spacing primitive. Mobile-web-first.
- **Core components** (shadcn base, brand-themed): Button (primary=blue,
  secondary=green), Badge (verified/context=green, warning=orange, error=red, neutral),
  Card, Skeleton, EmptyState, ErrorState, and the reusable **FeedCard** (+ skeleton) —
  props/mock data only, link-first, with a "Perché lo vedo?" placeholder.
- **Styleguide**: `/[locale]/styleguide` renders palette, type scale, logo, all
  components, and FeedCards with mock data (it default, en parity) for owner review on
  the Vercel preview.
- Tests: 13 passing (Button, Badge, Logo, FeedCard). Lint + typecheck + build green.

### Owner decisions (PR1)

- **FeedCard image radius**: ✅ resolved — capped at **16px** (`--radius-image`). The
  brand's literal 80px is preserved as `--radius-image-lg`, reserved for large/hero
  imagery only (FeedCard does not use it). Styleguide warning callout removed.
- **Dark mode**: ⬜ pending — not provided by the brand. Confirm whether to design an
  official dark palette later, or stay light-only (current: light-only).

## PR2 — Feed (public / cold-start) ✅

The real feed, read anonymously (backend returns cold-start). **No auth, no mode
selector, no interactions, no personalization** (those are PR4/PR5).

- **Data layer**: the browser calls a **same-origin Next route handler**
  (`src/app/api/feed/route.ts`) that proxies `GET ${API_BASE_URL}/api/feed` server-side
  (forwards cursor + limit, `Cache-Control` + `next: { revalidate: 60 }`) — no CORS, the
  backend URL stays server-only. This is the proxy pattern auth/CSRF reuse in PR4.
  TanStack Query `useInfiniteQuery` with `pageParam = nextCursor`; `getNextPageParam`
  stops on null. Items deduped by `articleId`. Response stays typed as the generated
  `FeedPage`. `Providers` (QueryClientProvider) added to the locale layout.
- **Feed page** (home `/[locale]`): FeedCard grid from real `FeedItemDto` data;
  infinite scroll via IntersectionObserver sentinel + "Carica altro" fallback button.
  FeedCard rewritten to consume the generated `FeedItem` type (title, sourceName +
  sourceType, relative `publishedAt`, excerpt, hotlinked image, topic chips,
  estimatedReadingMinutes, score). Card opens `url` in a new tab
  (`target=_blank rel="noopener noreferrer"`); all `displayMode`s resolve to that for
  now (TODO(PR5): OPENED_EXTERNAL interaction). Link-first — no article body.
- **"Perché lo vedo?"**: expander showing the scoreBreakdown (recency, topicMatch,
  sourceDiversity, topicVariety, clusterProminence) as labeled % bars + feedMode +
  recommenderVersion, explained in plain IT/EN.
- **States** (calm, not engagement-maximizing): skeleton grid (loading), friendly
  retry (error), sober empty state, and a "Sei in pari" caught-up state at end of feed
  (no endless spinner).
- **Images**: `next/image` `unoptimized` for arbitrary publisher hosts (remotePatterns
  already wildcard), with a brand placeholder (Ager symbol on beige) when `imageUrl`
  is null. 16px radius retained.
- **i18n + a11y**: all strings it (default) + en, brand tone; single keyboard focus
  target per card; meter roles on the score bars.
- Tests: 20 passing (feed renders from a mocked client, infinite scroll appends a
  second page with the threaded cursor, "Perché lo vedo" breakdown, empty/error/
  caught-up states, null-image fallback). Lint + typecheck + build green.

### Owner note (PR2)

- **CORS**: ✅ resolved by routing the feed through the same-origin proxy handler — the
  browser never calls the backend directly, so no CORS config is needed. Set
  `API_BASE_URL=https://api.agerculture.com` in Vercel (Production + Preview).

## PR3 — Article detail + OG + sources ✅

All backend calls go through same-origin proxies / server-side fetches (no CORS).

- **Proxy routes**: `src/app/api/articles/[id]`, `src/app/api/sources`,
  `src/app/api/sources/[id]` — shared `backendGet` + `proxyJson` helper
  (`src/lib/server/backend.ts`): forwards params, `Cache-Control` +
  `next: { revalidate: 60 }`, passes through 404, collapses other errors to 502.
- **Article page** `/[locale]/article/[id]`: server-rendered from the backend (shared
  `getArticle`), link-first (metadata only, no body) — title, source + type + date +
  author + reading time, excerpt, image (16px / placeholder), topics, license/paywall
  badges. Prominent "Leggi sull'editore" CTA opens `url` in a new tab
  (TODO(PR5): OPENED_EXTERNAL). `notFound()` → localized 404. `generateMetadata` sets
  title/description/OG/Twitter using `canonicalUrl`.
- **Dynamic OG** (`opengraph-image.tsx`, article + site-wide): branded card via
  `next/og` (Ager Blue, Editorial White, **Merriweather** title + Ager logo). Verified
  rendering a real backend title end-to-end. Runs on the **edge runtime** (required so
  `fetch(new URL(..., import.meta.url))` font loading works — the Node runtime can't
  fetch file: URLs). Merriweather woff fonts committed under `src/assets/fonts/`.
- **Sources**: `/[locale]/sources` (list, SSG+ISR) and `/[locale]/sources/[id]`
  (profile, `SourceDetailDto`: type, group, homepage, RSS, country/lang, license/ToS,
  TDM opt-out) with localized 404.
- it/en + brand tokens throughout; accessible. Tests: 38 passing (proxy param
  threading + 404/502, article render/null-fields/404, sources list/detail/404, OG
  export shape). Lint + typecheck + build green.

### Contract notes (PR3)

- `GET /api/articles/{id}` and `GET /api/sources` (list) declare **no 200 schema** in
  swagger. We reuse the generated `FeedItemDto` for the article (`Article` alias) and
  `SourceDetailDto[]` for the list, rendering defensively. If the backend later returns
  a different article-detail shape, add a real schema and regenerate.
- Source detail path is `/api/sources/{sourceId}` (not `{id}`).

## PR4 — Authentication ✅

OTP login + session/refresh/logout via a server-side route-handler proxy with HttpOnly
cookies + CSRF; personalized feed for logged-in users. **No tokens in browser JS.**

- **Backend mechanics (read, not assumed)**: login = `POST /api/auth/login/request-code
  {email}` then `POST /api/auth/login {email, otpCode}` → `AuthResultDto`
  {access+refresh+expiries+role}; `POST /api/auth/refresh {refreshToken}`; `POST
  /api/auth/logout {refreshToken}` (Bearer). CSRF: header `X-CSRF-TOKEN`, cookie
  `XSRF-TOKEN`, enforced **only when the request carries the cookie** (`EnforceAlways=off`)
  — Bearer/server-to-server clients are exempt by design. JWT access 30m, refresh 14d.
- **Route handlers** (`src/app/api/auth/*`): `request-code`, `verify` (sets `ager_at` +
  `ager_rt` HttpOnly cookies server-side, returns only `{userId, role}`), `refresh`
  (silent), `logout` (revoke + clear), `csrf` (seed token), `session`. Plus an authed
  `/api/me` proxy.
- **Authed proxy** (`authedBackendFetch`, extends `backendGet`/`proxyJson`): reads the
  access cookie → Bearer; **refreshes once on 401** and retries; performs the backend
  double-submit **CSRF handshake** on state-changing calls. The refresh token never
  reaches client JS.
- **Session**: `getSession()` (server, decodes the access JWT for display) + client
  `AuthProvider`/`useSession`. Header shows account menu + logout vs "Accedi".
  `/me` is a protected route (redirects to `/login?next=…`).
- **Login UI** `/[locale]/login`: email → code → verify, brand tone, it/en, accessible,
  error states (wrong/expired code → 401, rate-limit → 429).
- **Personalized feed**: the feed proxy attaches the user's Bearer when a session exists
  (→ backend personalizes; cache `private, no-store`); anonymous stays cold-start
  (cacheable).
- **Verified E2E against the real backend** (`api.agerculture.com`): `/api/auth/csrf` →
  200; `request-code` → 204; `verify` with a wrong code → **401** (not 403) — proving the
  CSRF handshake passes and the call reaches credential validation.
- Tests: 45 passing (login sets cookies; refresh-on-401 retry; CSRF header on writes;
  protected-route redirect; feed sends Bearer when authed, none when anon). Lint +
  typecheck + build green.

### Notes / follow-ups (PR4)

- CSRF is implemented (handshake on writes) but, per the backend's actual config, would
  also work without it for the Bearer BFF — kept it for correctness + future-proofing.
- The auth-aware root layout reads cookies, so pages render dynamically (was SSG for
  `/sources`, `/styleguide`). Acceptable; revisit if static perf matters.
- `next/og` article/site OG remain on the edge runtime (PR3).

## PR5 — Logged-in user layer ✅

Onboarding interests + interactions + reading lists, all via the PR4 authed proxy + CSRF.

- **Onboarding**: `GET /api/interests` (taxonomy, macro/subtopic), multi-select **5–10**,
  skippable. `POST /api/me/interests` saves (Explicit). Trigger: the verify route returns
  `needsOnboarding` (per-user `ager_onboarded` cookie); first login → `/onboarding?next=…`.
  Editable later at `/me/interests`.
- **Interactions** (`POST /api/interactions`, authed + CSRF, bound **by NAME**):
  OPENED_EXTERNAL (open publisher — fulfils the PR2 TODO), SAVE (couples to lists),
  DISCARD (optimistic remove from the feed cache), SHARE. Anonymous → prompt login
  (never calls the API unauthenticated). VIEW/READ_COMPLETED skipped for V1 (link-first).
- **Reading lists**: `GET/POST /api/me/reading-lists`, add/remove items.
  `/me/reading-lists` page (lists + items + create + optimistic remove). Card "Salva"
  adds to a default list ("Salvati"/"Saved", created if missing) and fires SAVE.
- **/me hub**: profile (PR4) + entry points to Interests and Reading lists.
- Optimistic UI (discard/remove), TanStack Query invalidation after mutations, it/en,
  accessible, fully auth-gated.
- Tests: 50 passing (interest save ≥5; DISCARD posts the right type; reading-list
  create/add/remove optimistic; anon actions prompt login; verify→needsOnboarding).
  Lint + typecheck + build green.

### Contract notes (PR5)

- `InteractionType` shows as an int enum in swagger but the DTO binds **by name**
  (`JsonStringEnumConverter`) — we send the string names. (Backend PR-B now emits it as a
  string enum in the contract.)
- ~~There is no GET for interests, so onboarding is gated by a per-user cookie.~~
  **Superseded** (see interests-editor PR): `GET /api/me/interests` now exists, so
  onboarding state is server truth and the `ager_onboarded` cookie was dropped.
- ~~Reading-list item DTOs (`ArticleInListDto`) aren't in the contract, so they're typed
  locally in `features/reading-lists/types.ts`.~~ **Superseded** by the reading-list rich
  port: PR-B types the item pages, so the local types file was deleted and the generated
  `ArticleInListDto` is used.

## Interests editor — server truth + no hard cap ✅ (`feat/prompt-interests`)

After backend PR-B added `GET /api/me/interests` + the string-enum contract:

- **Contract refreshed** (copied `swagger.json`, `pnpm gen:api`): `GET /api/me/interests`,
  string-enum interactions, typed reading-list pages now in the client.
- **Onboarding = server truth**: the verify route detects onboarding via
  `GET /api/me/interests` (empty → `/onboarding`) and the `ager_onboarded` cookie + the
  `/api/me/onboarding/skip` route were **removed**. Skip is now plain client navigation.
- **Interests editor** `/me/interests`: loads the user's current interests
  (`useMyInterests`) and pre-selects them; add/remove from the full taxonomy; save via
  `POST /api/me/interests`; on save it invalidates the feed + my-interests caches and
  hints that the feed will personalize.
- **No hard 10 cap**: `InterestPicker` removed the max (pick as many as you like); a soft
  ~5 minimum is a hint only (save needs ≥1, the backend min). Onboarding copy now says
  "scegline almeno 5".
- Tests: 51 passing (soft-min/no-max picker, editor pre-selection, verify→server-truth
  onboarding). Lint + typecheck + build green.

## Reading-list rich port ✅ (`feat/prompt-lists`)

Ports the old ager-web reading-list UX onto the typed PR-B endpoints
(`ReadingListsPageDto` / `ReadingListItemsPageDto` / `ArticleInListDto`, `isDefault`,
string-enum interactions). All writes go through the PR4 authed proxy + CSRF.

- **Lists index** `/me/reading-lists`: each list shows name, visibility label, item count
  (ICU plural), and a delete-confirm (`window.confirm`) — except the default **"Salvati"**
  (`isDefault`), which is pinned first, badged, and not deletable. "Crea lista" opens the
  create dialog.
- **List detail** `/me/reading-lists/[id]`: header (name + created date), typed items via
  `GET …/items` (note in italics, source · date · reading-time = ⌈wordCount/200⌉,
  thumbnail or Ager symbol), per-item Remove (optimistic across infinite pages),
  infinite scroll (IntersectionObserver + "Carica altro"). New proxy
  `src/app/api/me/reading-lists/[id]/route.ts` for list DELETE.
- **Add-to-list dialog** (Radix Dialog): pick a target list (with counts + default badge)
  + optional note; remembers the last-used list in `localStorage` (`ager:lastListId`) and
  preselects it (last → default → first); toast names the list on success. Secondary to
  the one-tap fast path.
- **One-tap Save** stays the fast path → fires `SAVE`; the backend auto-files into the
  default "Salvati" list (PR-B), so the client no longer creates lists itself.
- **Default surface**: account menu has a "Salvati" entry resolving to the `isDefault`
  list id (+ a "Liste di lettura" entry to the index).
- **3-second optimistic Undo** (Save / Hide): a `ToastProvider` holds the deferred-commit
  timer (survives the card unmounting on Hide). Hide removes the item from the feed cache
  immediately; the toast's "Annulla" cancels the commit and restores the snapshot; on
  expiry it posts `DISCARD`/`SAVE` and invalidates. New `toast.tsx` + `dialog.tsx`
  primitives; `renderWithProviders` now wraps `ToastProvider`.
- **Create-list dialog**: name, optional description, visibility (private/public).
- Optimistic UI + query invalidation, brand tokens, it/en, accessible. Tests: 57 passing
  (+ deferred-commit/undo on Hide, lists index pin/badge/delete-confirm, add-to-list
  last-list memory + note, detail optimistic remove, create-via-dialog). Lint + typecheck
  + build green. Local `features/reading-lists/types.ts` deleted in favor of the generated
  `ArticleInListDto`.

## PR6 — Feed modes + stats + search ✅ (`feat/prompt6`)

Three logged-in/discovery surfaces, all via the typed client through same-origin proxies.

- **Feed mode selector** — a control over the six recommender modes (`balanced` default,
  `most_recent`, `more_pluralism`, `most_personalized`, `less_personalized`,
  `chronological`). The mode flows through the feed proxy (`?mode=`) and is part of the
  feed query key, so switching re-ranks. Persisted in `localStorage` (`ager:feedMode`) via
  a new `usePersistentState` hook (`useSyncExternalStore` — no set-state-in-effect, no
  hydration mismatch). Anonymous visitors still get cold-start with a note that modes
  personalize once signed in; logged-in → ranking changes. Feed page now renders
  `<FeedView>` (selector + note + list). Interaction handlers (Hide/Save) match all
  `["feed", …]` caches by prefix via `getQueriesData`/`setQueriesData`.
- **me/stats dashboard** `/me/stats` (guarded) — `GET /api/me/stats?window=` via the authed
  proxy, with a 7d/14d/30d window selector (persisted). Renders variety indices:
  distinct-source ratio + top-topic share as percent meters, total interactions, and bar
  lists for counts-by-interaction-type (localized labels) and topic distribution. Added to
  the `/me` hub as a third entry.
- **Search** `/cerca` (public) — `GET /api/articles/search` (free-text, `page`/`pageSize`
  offset paging, optional `lang`) + tag browse (`GET /api/articles/tags`,
  `GET /api/articles/tags/{tag}/search`). Results render as article rows; since search DTOs
  carry **no publisher URL**, rows link to the internal article page (`/article/{id}`),
  preserving the link-first invariant. Offset paginator (prev/next + "page X of Y"). Tag
  chips toggle tag-search mode. Seeds from `?q=`. Added "Cerca" to the header nav.
- New proxies: `api/feed` (forwards `mode`), `api/me/stats`, `api/articles/search`,
  `api/articles/tags`, `api/articles/tags/[tag]/search`. New aliases in the client:
  `ReadingStats`, `ArticleSearchResult(sPage)`, `ArticleTag`.
- Brand tokens, it/en, accessible (labeled select, meter roles, `role="search"`,
  `aria-pressed` toggles, `aria-live` result count). Tests: **65 passing** (+ feed mode
  select/persist/anon-note, stats window switch + indices, search text/tag/paginate).
  Lint + typecheck + build green.

### Notes / follow-ups

- Note: the contract marks all `FeedItemDto` fields optional (no `required`), so the
  card renders defensively (guards + fallbacks).
- Stats window values (`7d`/`14d`/`30d`) are sent as the `window` query string verbatim;
  the backend parses them. `byType` keys are mapped to localized labels with a raw-key
  fallback, so unknown interaction names still render.
- Next 16 deprecated the `middleware` file convention → using `src/proxy.ts`.
- `next/image` `remotePatterns` currently allows any https host (link-first hotlinking);
  tighten to a source allowlist when sources land (PR2/PR3).
- CSP/HSTS hardening (carried from the old app) is **not** wired yet — schedule for the
  app-shell/security pass (PR1/PR6).
- Owner: connect Vercel (root dir `apps/web`), set `NEXT_PUBLIC_API_BASE_URL`.
