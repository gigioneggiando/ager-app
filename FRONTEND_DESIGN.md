# AGER Frontend — Design & Decisions

Transcription of the **locked** decisions from
`docs/agent-context/Frontend_Plan_v1.md` (status: LOCKED post deep-research, 2026-06),
adapted as the in-repo reference for the frontend coding agent. Web first; mobile later.

## Why this stack (one line)

The frontend is written 100% by AI agents → pick where LLMs code best. High-resource
languages (JS/TS) and the React / TypeScript / Tailwind / shadcn stack yield materially
higher-quality, less-hallucinated AI code than Dart/Swift/Kotlin. Next.js also delivers
the news-web essentials (dynamic Open Graph, SEO/metadata, fast first paint); Expo/RN
keeps mobile in the same TypeScript.

## Locked decisions

- **Language**: TypeScript everywhere (strict).
- **Web** = Next.js (App Router), real React DOM (not React-Native-Web).
- **Mobile** = Expo / React Native (added later). No shared UI components web↔mobile, but
  shared **logic / types / client**.
- **Repo** = single monorepo, pnpm + Turborepo:
  - `apps/web` — Next.js
  - `apps/mobile` — Expo (later)
  - `packages/api-client` — typed client generated from the backend OpenAPI
  - `packages/shared` — shared types, zod schemas, design tokens
- **Web libraries** (the AI-convergent set): Tailwind CSS, shadcn/ui (Radix), TanStack
  Query (server state), next-intl (i18n), zod + react-hook-form (validation/forms),
  next/og (OG images). Testing: Vitest + Testing Library; Playwright e2e optional.
- **API client**: openapi-typescript (types) + openapi-fetch (runtime), generated from
  the committed OpenAPI; regenerated when the contract changes. **Single source of truth
  = backend `docs/openapi/swagger.json`** (copied here to
  `packages/api-client/openapi/swagger.json`).
- **Deploy**: web → Vercel (SSR/OG/CDN); mobile → Expo EAS + stores (later).
- **i18n**: locales `it` (default) + `en`.
- **Auth**: backend JWT (access + refresh) + CSRF double-submit + magic-link/OTP. Use
  Next **route handlers as a server-side proxy** for the auth/cookie/CSRF dance (HttpOnly
  refresh cookie). Public reads can call the API directly via `NEXT_PUBLIC_API_BASE_URL`.
- **Rebuild from scratch**: the old `ager-web` is shelved (broke against the new
  contract). Do not import from it.

## Architecture & conventions

- **Data flow**: Server Components for initial render where useful; TanStack Query for
  client-side caching / infinite scroll; the typed client wraps `fetch` and injects auth.
- **Two call patterns** (match per use):
  1. Next route handlers proxying the backend for anything needing cookies/CSRF/secrets
     (auth, interactions).
  2. Direct browser calls for public reads (feed / articles / sources).
- **State**: minimal — TanStack Query for server state; React context for session/auth +
  feed-mode/locale.
- **Design system**: shadcn/ui + Tailwind tokens in `packages/shared`; light/dark;
  responsive **mobile-web-first** (no native app yet, so the web must be great on phones).
- **Theming is token-driven**: neutral shadcn defaults now; the owner swaps the palette
  in `packages/shared/src/tokens.ts` + `apps/web/src/app/globals.css` in ONE place. Do
  not hardcode brand colors.
- **Transparency UI** (Recommender §13.2): feed cards can surface `score` +
  `scoreBreakdown` + `feedMode` + `recommenderVersion` ("Perché lo vedo?").
- **Link-first invariant**: never render the article body; cards show
  title / excerpt / hotlinked image / source; the primary action redirects to the
  publisher per `displayMode` (`redirect` | `webview` | `reader_optin`).
- **Security**: strict CSP (carry the old app's HSTS / `frame-ancestors DENY` learnings);
  no secrets in client; tokens via HttpOnly cookie through the proxy.
- **Contract-driven**: types come from the generated client; no hand-written DTOs that
  can drift from the API.

## PR roadmap (Sprint 5, web)

| PR  | Scope |
| --- | ----- |
| **PR0** | Scaffold: pnpm+Turborepo; `apps/web` Next.js (App Router, TS strict, Tailwind, shadcn init); next-intl (it/en); `packages/api-client` generated from `swagger.json`; `packages/shared` (tokens); env; CI (lint + typecheck + build + vitest); this doc + tracker; Vercel config notes. **← current** |
| **PR1** | Design system + app shell: root layout, theme (light/dark), typography/spacing tokens, nav/header, reusable FeedCard + skeleton/empty/error states, i18n wiring, locale switch. |
| **PR2** | Feed: `GET /api/feed` — infinite scroll via opaque cursor, feed-mode selector (6 modes), FeedCard with score / "perché lo vedo", cold-start vs personalized; TanStack Query caching. |
| **PR3** | Article + sources: article detail + redirect-to-publisher (per `displayMode`), `GET /api/articles/{id}`, search (`/api/articles/search`), sources list/detail; per-route metadata + `next/og`. |
| **PR4** | Auth: magic-link + OTP login, JWT access/refresh (HttpOnly cookie + CSRF), session context, protected routes, logout — via Next route-handler proxy. |
| **PR5** | Onboarding + me: interests onboarding (`GET /api/interests`, `POST /api/me/interests`); interactions (VIEW / OPENED_EXTERNAL / READ_COMPLETED / SAVE / DISCARD / SHARE); reading-lists CRUD; `me/stats` dashboard. |
| **PR6** | Polish + deploy: PWA (manifest + SW, installable), OG finalize, Lighthouse/perf, a11y, error boundaries; deploy to Vercel + smoke; tag `frontend-web-v1`. |
| **5b** | Mobile (later): `apps/mobile` Expo app reusing `packages/api-client` + `packages/shared`; feed/article/auth/onboarding parity; EAS → TestFlight/Play. |

## Risks / notes (carried from the plan)

- RN-Web is community-grade → web stays real Next.js; RN only for native mobile.
- Backend auth endpoint paths differ from the Mobile Roadmap doc names (e.g. login is
  `/api/auth/login/request-code`) → **read the actual OpenAPI, not doc names.**
- Swagger UI is Dev-only on the backend; the committed `swagger.json` is the contract
  artifact to generate from.
- CORS/CSRF: confirm the backend allows the web origin and the double-submit cookie flow
  works cross-site (Vercel domain ↔ `api.agerculture.com`) — validate early in PR4.

## Owner open items (from the plan)

1. Web deploy: Vercel (recommended) vs self-host on the Debian box.
2. Design direction: AI-default clean (shadcn "neutral", sober news look) vs owner-
   provided brand/colors.
