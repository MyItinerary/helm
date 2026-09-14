# Architecture — helm

`helm` is MyJourny's admin + guide portal. **This is "the admin"** — a previous portal (`admin/`, hosted under a personal GitHub account rather than the `MyItinerary` org) is deprecated and superseded by this one; don't port conventions from it, since `helm` uses a different UI toolkit entirely.

For the platform-wide picture (how `helm` fits alongside `itin`, `mobile-app`, and `myjourny-frontend`), see the [`myjourny-docs`](https://github.com/MyItinerary/myjourny-docs) repo — this file covers `helm` specifically.

## Stack

Next.js 14 (App Router) · TypeScript · React Bootstrap + a CoreUI admin template · Chart.js · Zustand · TanStack Query v5 · Axios · pnpm workspace · Cypress (e2e — currently stale, see Testing below).

`helm` began life as a fork of the open-source [`kitloong/nextjs-dashboard`](https://github.com/kitloong/nextjs-dashboard) template. Some template artifacts are still in place: the CI workflow, `.github/FUNDING.yml`, and a `next.config.js` remote-image pattern still reference the template rather than MyJourny/Cloudinary — worth cleaning up rather than mistaking for intentional MyJourny configuration.

## Local development

```bash
pnpm install && pnpm run dev
# → http://localhost:3000
```

## Structure

```
src/
├── app/
│   ├── (authentication)/login/
│   └── (dashboard)/           # authenticated shell
│       ├── admin/              # categories, social-media-import, temporary-experiences review
│       ├── bookings/, experiences/, guides/, payments/, users/
│       ├── settings/            # the logged-in admin's own account
│       └── team/                 # superadmin-only — admin management
├── components/, hooks/, lib/, services/, store/, styles/, themes/, types/, utils/, zod/
└── middleware.ts                  # route protection — see Auth below
```

## Features (from the live sidebar)

Users · Guides (incl. verification) · Experiences (CRUD) · Bookings · Payments & payouts · Categories · **Social media import** (review experience candidates scraped from Reddit/Twitter/Instagram/Facebook by `itin`'s import pipeline) · **Temporary experiences** (review/approve/reject AI-generated listings before they publish) · Settings · Team (superadmin-only admin management, hidden from the nav for regular admins).

## Auth

Email + password only. Login posts to `itin`'s `/admin/login`, a separate token namespace from the regular-user `/auth/login` used by `mobile-app`/`myjourny-frontend`.

**Token storage:** the JWT `access_token` and `role` are set as plain, non-httpOnly cookies via `js-cookie` on the client (`sameSite: strict`, 7-day expiry). Because they're set from JavaScript rather than a server `Set-Cookie` header, they're readable by any script running on the page — see the platform security assessment (`myjourny-docs/security/security-assessment.md`) for the full writeup. Admin profile/role are also mirrored into `localStorage` via Zustand's persist middleware (not the JWT itself).

**Route protection:** `src/middleware.ts` checks only for the *presence* of the token cookie, not its validity or the account's role — role-specific gating (e.g. `/team` being superadmin-only) is enforced by the page itself reading Zustand state client-side, with real enforcement happening on the `itin` side.

## API communication

Single Axios instance (`src/lib/api.ts`), `baseURL` from `NEXT_PUBLIC_API_URL`, injects `Authorization: Bearer <token>` from the cookie on every request, force-redirects to `/login` on any `401`. All backend calls are namespaced under `/admin/*` on `itin`. Image uploads use a signed-Cloudinary pattern — this app requests a short-lived signature from `itin` rather than holding a Cloudinary secret itself.

## Configuration (env var names only)

Actually used: `NEXT_PUBLIC_API_URL`. A number of other vars present in `.env*` files (`NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_GOOGLE_ADSENSE_ID`, `NEXT_PUBLIC_POKEMON_LIST_API_BASE_URL`, etc.) are unused template leftovers, not live configuration.

## Testing

Cypress is configured but its one spec (`login.cy.ts`) targets the original template's login form and routes, not this app's — it doesn't currently exercise real login behavior. No unit/component tests exist. CI (`.github/workflows/ci.yml`) runs lint + build only.

## Related

- Platform-wide docs, diagrams, and the full security assessment: [`myjourny-docs`](https://github.com/MyItinerary/myjourny-docs)
