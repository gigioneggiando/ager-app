# AGER — Frontend Monorepo

Link-first Italian civic news aggregator. A feed of article **cards** that redirect to
the publisher — there is **no article body** anywhere in the product (link-first
invariant). Backend is a .NET REST API, live at `https://api.agerculture.com`.

This repo is the **new** frontend (web now, mobile later). See
[`FRONTEND_DESIGN.md`](./FRONTEND_DESIGN.md) for the locked architecture decisions and
[`frontend_status.md`](./frontend_status.md) for the build roadmap / progress.

## Stack

- **Monorepo**: pnpm workspaces + Turborepo
- **Web**: Next.js 16 (App Router, TypeScript strict), Tailwind CSS v4 + shadcn/ui
  (neutral base), next-intl (it default / en), TanStack Query, zod + react-hook-form
- **API client**: generated from the backend OpenAPI with openapi-typescript +
  openapi-fetch — the contract is the single source of truth
- **Tests**: Vitest + Testing Library
- **Deploy**: web → Vercel (owner connects the project)

## Layout

```
ager-app/
├─ apps/
│  └─ web/                 Next.js app (App Router, [locale] routing)
├─ packages/
│  ├─ api-client/          typed client generated from openapi/swagger.json
│  └─ shared/              design tokens + shared zod schemas/types
├─ turbo.json              Turborepo task graph
└─ pnpm-workspace.yaml
```

`apps/mobile` (Expo/React Native) is added in a later sprint and will reuse
`packages/api-client` + `packages/shared`.

## Prerequisites

- **Node 22** (see `.nvmrc`)
- **pnpm 11** — `corepack enable pnpm` (or `npm i -g pnpm`)

## Local development

```bash
pnpm install            # install the whole workspace
pnpm gen:api            # regenerate the typed API client from the committed contract
pnpm dev                # run all dev servers (web on http://localhost:3000 → /it)

# Quality gates (CI runs these in order — run them before handing work back):
pnpm lint
pnpm typecheck
pnpm build
pnpm test
```

The web app reads `NEXT_PUBLIC_API_BASE_URL` (default `https://api.agerculture.com`).
Copy `apps/web/.env.example` to `apps/web/.env.local` to point at a local backend.

### Updating the API contract

The backend contract lives at `packages/api-client/openapi/swagger.json` (copied from
the backend repo's `docs/openapi/swagger.json`). When the backend contract changes:

1. Replace `packages/api-client/openapi/swagger.json` with the new version.
2. Run `pnpm gen:api` to regenerate `packages/api-client/src/generated/schema.ts`.
3. Commit both. CI fails if the generated client is stale vs. the committed contract.

Never hand-edit `schema.ts` or hand-write DTOs — types come from the generated client.

## Vercel (owner — do not deploy from here)

This is a Turborepo monorepo; the deployable app is `apps/web`. When connecting the
project in Vercel:

- **Framework preset**: Next.js
- **Root Directory**: `apps/web` (enable *"Include files outside the root directory"* so
  the workspace packages resolve)
- **Build Command**: `pnpm turbo run build --filter=@ager/web` (or leave Vercel's
  default — it detects Turborepo)
- **Install Command**: `pnpm install` (Vercel auto-detects pnpm from the lockfile)
- **Output Directory**: `.next` (default)
- **Node version**: 22
- **Environment variables**: set `NEXT_PUBLIC_API_BASE_URL`

## Conventions

- **Link-first**: never render an article body.
- **i18n**: locales `it` (default) + `en`; URLs are locale-prefixed (`/it`, `/en`).
- **Theming is token-driven** — neutral shadcn defaults for now. Swap the palette in
  `packages/shared/src/tokens.ts` + `apps/web/src/app/globals.css`. Do **not** hardcode
  brand colors.
- **Auth** (later): cookie/CSRF dance via Next route handlers; public reads call the API
  directly via `NEXT_PUBLIC_API_BASE_URL`.
- **One PR per prompt**; branch `feat/<topic>` off `main`, open PR vs `main`, owner
  merges.
