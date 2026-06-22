# Ager Web — Acceptance / Smoke Test

Pre-release checklist for the Ager web frontend (`apps/web`). Run against a deployed
preview/production build (or `pnpm --filter @ager/web build && pnpm --filter @ager/web start`).
Each item lists the shipped surface and how to verify it. `✓` = implemented and covered by
automated tests and/or a manual pass.

Automated gate (CI + local): `pnpm i && pnpm --filter @ager/web lint && …typecheck && …build && …test`
— **66 unit tests green**.

## Shipped surface

### Feed — personalized + 6 modes ✓
- [x] Public/cold-start feed loads anonymously (`GET /api/feed` via same-origin proxy).
- [x] Infinite scroll via opaque cursor; calm "Sei in pari" caught-up state (no endless spinner).
- [x] **Feed mode selector** — 6 modes (balanced, most_recent, more_pluralism,
      most_personalized, less_personalized, chronological); choice persisted
      (`localStorage: ager:feedMode`); switching re-ranks. Anonymous note explains modes
      personalize once signed in; logged-in feed sends the Bearer and personalizes.
- [x] "Perché lo vedo?" transparency (score + breakdown + feedMode + recommenderVersion).

### Article + sources + OG ✓
- [x] Article detail `/article/{id}` — link-first (metadata only, no body); "Leggi
      sull'editore" CTA opens the publisher in a new tab.
- [x] Per-article dynamic Open Graph image (`next/og`, edge) + canonical + Twitter card.
- [x] Sources list `/sources` + detail `/sources/{id}`; localized 404.

### Auth ✓
- [x] OTP login `/login` (request code → verify) via route-handler proxy; HttpOnly
      `ager_at`/`ager_rt` cookies; CSRF double-submit; refresh-on-401. No tokens in JS.
- [x] Protected routes (`/me`, `/me/*`) redirect to `/login?next=…`.

### Onboarding + interests ✓
- [x] First login → `/onboarding` (server-truth via `GET /api/me/interests`); soft ~5
      minimum, no hard cap; skippable.
- [x] Interests editor `/me/interests` pre-selects current interests; save invalidates feed.

### Interactions ✓
- [x] OPENED_EXTERNAL on publisher open; SAVE / DISCARD / SHARE; anonymous → prompt login.
- [x] 3-second optimistic **Undo** on Save / Hide (deferred commit via ToastProvider).

### Reading lists (rich) ✓
- [x] Lists index `/me/reading-lists` (default "Salvati" pinned + badged, not deletable;
      delete-confirm for others; create dialog).
- [x] List detail `/me/reading-lists/{id}` — typed items (note, source · date ·
      reading-time, thumbnail), per-item optimistic remove, infinite scroll.
- [x] Add-to-list dialog (target list + counts + note; last-used list remembered).

### Stats ✓
- [x] `/me/stats` — `GET /api/me/stats?window=` with 7d/14d/30d selector; distinct-source
      ratio + top-topic share meters, total interactions, counts-by-type + topic bars.

### Search ✓
- [x] `/cerca` — full-text search (`GET /api/articles/search`, offset paging) + tag browse
      (`/api/articles/tags`, `/api/articles/tags/{tag}/search`); results link to the
      internal article page (link-first); offset paginator.

### PWA ✓
- [x] Web app manifest (`/manifest.webmanifest`) — name/short_name, brand theme
      (#0F2A44) / background (#F9FAF7), 192 + 512 + maskable icons, `display: standalone`.
- [x] Service worker (`/sw.js`) — installable; caches the static shell
      (`/_next/static`, `/brand`) cache-first; never caches `/api/*` or HTML (no stale
      auth/personalized content). Registered in production only.

### Metadata / OG / SEO ✓
- [x] Site-wide defaults: title template, description, `metadataBase`, canonical,
      OpenGraph (website) + Twitter `summary_large_image`, site-wide OG image.
- [x] `/me/*` marked `robots: noindex`.

### Perf / a11y / resilience ✓
- [x] `next/image` with explicit `sizes` + fixed aspect ratios (no CLS); fonts via
      `next/font` (`display: swap`).
- [x] Keyboard/focus order, `aria` (meters, `role="search"`, `aria-pressed`, `aria-live`),
      brand-token contrast; single focus target per feed card.
- [x] Route error boundary (`error.tsx`) + last-resort `global-error.tsx`; polished
      localized 404 (`not-found.tsx`).
- [x] Security headers (CSP with `frame-ancestors 'none'`, HSTS preload, `X-Frame-Options
      DENY`, `nosniff`, Referrer-Policy, Permissions-Policy).

## Manual pass (deployed preview)
- [ ] Install prompt appears (Chrome → Install Ager); app opens standalone with brand icon.
- [ ] Lighthouse (mobile) ~90+ for Performance / Accessibility / Best-Practices / SEO.
- [ ] OG preview renders (e.g. share an article link in a card validator).
- [ ] Login → onboarding → feed personalizes; save/hide/undo; reading lists; stats; search.

## Production
- [ ] Vercel Production build from `main` green (root dir `apps/web`).
- [ ] After ratify + merge: `git tag frontend-web-v1 && git push origin frontend-web-v1`.
- [ ] Custom domain — owner step.
