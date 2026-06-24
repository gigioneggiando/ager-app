# @ager/marketing

The public **marketing landing** for the apex domain **agerculture.com**. The app itself
(feed, auth, account) lives separately in `apps/web` on **app.agerculture.com**.

Sober/editorial, brand-driven (Merriweather + Inter, official palette via
`@ager/shared/brand.css`), SSR + OG/metadata, `it`/`en`. No auth, no backend calls — the
only outbound links are top-level navigations to the app.

## Why a separate app (not a hostname-routed section in `apps/web`)

- **Zero risk to the app.** The production app's auth, CSP (with OAuth inline-script
  exceptions), and middleware-free routing are untouched.
- **No token duplication.** The brand palette is shared from `@ager/shared` (`brand.css` +
  `tokens.ts` + logo assets), so both apps stay in lockstep from one source.
- **Idiomatic Turborepo + Vercel.** Two projects from one monorepo, each pointed at its own
  domain — the standard multi-site setup. Avoids host-based rewrites fighting the next-intl
  routing.

## Local dev

```bash
pnpm --filter @ager/marketing dev     # http://localhost:3001
pnpm --filter @ager/marketing build
pnpm --filter @ager/marketing test
```

## Environment

| Var | Default | Purpose |
| --- | ------- | ------- |
| `NEXT_PUBLIC_APP_URL`  | `https://app.agerculture.com` | Target of every "Apri Ager" CTA + the footer about/DSA/bot links. |
| `NEXT_PUBLIC_SITE_URL` | `https://agerculture.com`     | `metadataBase` for canonical/OG URLs. |

Defaults are production-correct, so no env is required for a prod build; override for
preview deployments.

## Vercel setup (apex landing vs app subdomain)

Two Vercel projects, both from the `gigioneggiando/ager-app` monorepo:

| Project | Root directory | Production domain |
| ------- | -------------- | ----------------- |
| **ager-marketing** | `apps/marketing` | `agerculture.com` (apex) + `www.agerculture.com` → redirect to apex |
| **ager-web** (existing) | `apps/web` | `app.agerculture.com` |

Steps:

1. **New Project** → import `gigioneggiando/ager-app` → set **Root Directory** to
   `apps/marketing`. Vercel detects Next.js + the pnpm workspace; the build command stays
   `next build` (run from the app root). `pnpm install` at the repo root hydrates the
   workspace.
2. **Domains** → add `agerculture.com` as the production domain, and `www.agerculture.com`
   redirecting to it. Point the apex DNS at Vercel (A/ALIAS per Vercel's instructions).
3. Leave the existing **ager-web** project mapped to `app.agerculture.com` (move the apex
   off it if it was ever attached there).
4. No env vars are required (defaults are correct); set `NEXT_PUBLIC_*` overrides only for
   previews.

Result: `agerculture.com` → this landing; `app.agerculture.com` → the app. The landing's
CTAs and footer link straight into the app on the subdomain.
