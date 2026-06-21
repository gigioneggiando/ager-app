# Frontend Status

Tracker for the AGER web frontend (Sprint 5). One PR per prompt; branch `feat/<topic>`
off `main`, open PR vs `main`, owner ratifies/merges. See
[`FRONTEND_DESIGN.md`](./FRONTEND_DESIGN.md) for the locked decisions.

| Prompt | Scope | Branch | Status |
| ------ | ----- | ------ | ------ |
| **PR0** | Scaffold: monorepo + Next.js web app + OpenAPI client + CI | `feat/prompt0` | ✅ Merged (#1) |
| **PR1** | Design system + app shell — official Ager brand (tokens, fonts, logo/favicon, shell, components, FeedCard, styleguide) | `feat/prompt1` | ✅ Done — PR open vs `main` |
| **PR2** | Feed — public/cold-start (`GET /api/feed` anonymous, infinite scroll, transparency) | `feat/prompt2` | ✅ Done — PR open vs `main` |
| PR3 | Article + sources (detail, redirect-to-publisher, search, OG) | — | ⬜ Not started |
| PR4 | Auth (magic-link + OTP, JWT/CSRF via route-handler proxy, session) | — | ⬜ Not started |
| PR5 | Onboarding + me (interests, interactions, reading lists, stats) | — | ⬜ Not started |
| PR6 | Polish + deploy (PWA, OG, Lighthouse, a11y, Vercel, tag `frontend-web-v1`) | — | ⬜ Not started |
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

- **Data layer**: generated openapi-fetch client calls `GET /api/feed { cursor?, limit? }`
  (no auth header). TanStack Query `useInfiniteQuery` with `pageParam = nextCursor`;
  `getNextPageParam` stops on null. Items deduped by `articleId`. `Providers`
  (QueryClientProvider) added to the locale layout.
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

### ⚠ Owner note (PR2)

- **CORS**: the browser calls `https://api.agerculture.com/api/feed` directly (per the
  plan's public-read pattern). The backend must allow the web origin
  (Vercel preview/prod + `localhost:3000`) or the feed shows the error state. Validate
  the CORS allowlist — flagged in the plan for PR4, but it gates the live feed now.

### Notes / follow-ups

- Note: the contract marks all `FeedItemDto` fields optional (no `required`), so the
  card renders defensively (guards + fallbacks).
- Next 16 deprecated the `middleware` file convention → using `src/proxy.ts`.
- `next/image` `remotePatterns` currently allows any https host (link-first hotlinking);
  tighten to a source allowlist when sources land (PR2/PR3).
- CSP/HSTS hardening (carried from the old app) is **not** wired yet — schedule for the
  app-shell/security pass (PR1/PR6).
- Owner: connect Vercel (root dir `apps/web`), set `NEXT_PUBLIC_API_BASE_URL`.
