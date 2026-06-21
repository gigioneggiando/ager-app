# Frontend Status

Tracker for the AGER web frontend (Sprint 5). One PR per prompt; branch `feat/<topic>`
off `main`, open PR vs `main`, owner ratifies/merges. See
[`FRONTEND_DESIGN.md`](./FRONTEND_DESIGN.md) for the locked decisions.

| Prompt | Scope | Branch | Status |
| ------ | ----- | ------ | ------ |
| **PR0** | Scaffold: monorepo + Next.js web app + OpenAPI client + CI | `feat/prompt0` | ✅ Done — PR open vs `main` |
| PR1 | Design system + app shell (theme, tokens, nav, FeedCard, states, locale switch) | — | ⬜ Not started |
| PR2 | Feed (`GET /api/feed`, infinite scroll, feed modes, transparency) | — | ⬜ Not started |
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

### Notes / follow-ups

- Next 16 deprecated the `middleware` file convention → using `src/proxy.ts`.
- `next/image` `remotePatterns` currently allows any https host (link-first hotlinking);
  tighten to a source allowlist when sources land (PR2/PR3).
- CSP/HSTS hardening (carried from the old app) is **not** wired yet — schedule for the
  app-shell/security pass (PR1/PR6).
- Owner: connect Vercel (root dir `apps/web`), set `NEXT_PUBLIC_API_BASE_URL`.
