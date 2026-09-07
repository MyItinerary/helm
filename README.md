# Helm

The guide + admin web portal for **MyJourny** — where local guides list and manage experiences, and where MyJourny staff oversee the marketplace.

## Problem

Finding an authentic, local-led travel experience is harder than it should be. Generic listing sites and map apps surface the same crowded landmarks and stale reviews, with no reliable way to tell which local guides are trustworthy, available, and worth paying. On the other side, local guides have no real marketplace: no easy way to list an experience, get discovered by the right traveller, take a booking, and actually get paid — so a lot of great local expertise never reaches the travellers who'd pay for it.

## Value proposition

MyJourny connects travellers with vetted local guides for bookable, curated experiences — verified guides, integrated payments and payouts, and semantic discovery, replacing generic listings with real local expertise.

This portal is the guide- and operator-facing side of that promise:

- **Guides run their business here** — create and manage experience listings, see bookings come in, and track payouts, without needing to touch the backend directly.
- **Verification and trust are enforced here, not assumed** — guide onboarding and approval, dispute visibility, and moderation happen in this portal before an experience reaches a traveller.
- **Admins keep the marketplace healthy** — user, booking, payment, and team management live under one roof so the platform can be operated day to day, not just built.

## Tech Stack

Next.js 14 (App Router) · TypeScript · React Bootstrap + CoreUI admin template · Chart.js · Zustand · TanStack Query · Axios · Cypress (e2e) · pnpm

## Getting Started

```bash
pnpm install
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the result.

Copy `.env.example` to `.env.local` (and set up `.env.development`/`.env.production` as needed) and fill in the values before running — check `.env.example` for the current full list, since it varies by environment.

## Project Structure

```
helm/
├── src/
│   ├── app/                 # App Router routes
│   │   ├── (authentication)/  # Login
│   │   └── (dashboard)/       # Authenticated portal
│   │       ├── admin/          # Admin-only views
│   │       ├── bookings/       # Booking management
│   │       ├── experiences/    # Guide experience listings
│   │       ├── guides/         # Guide management/verification
│   │       ├── payments/       # Payment/payout views
│   │       ├── settings/       # Account/portal settings
│   │       ├── team/           # Team/staff management
│   │       └── users/          # Traveller user management
│   ├── components/          # UI components
│   ├── hooks/                # Custom hooks
│   ├── lib/                  # Shared utilities/config
│   ├── services/             # API client / service layer (talks to `itin`)
│   ├── store/                 # Zustand stores
│   ├── styles/, themes/      # CoreUI/Bootstrap theming
│   ├── types/, zod/           # TypeScript types + Zod schemas
│   └── middleware.ts         # Route protection
└── cypress/                  # End-to-end tests
```

## Testing

```bash
pnpm cypress open   # interactive
pnpm cypress run    # headless
```

## Notes

- Talks to the [`itin`](https://github.com/MyItinerary/itin) API for all data — guides, experiences, bookings, users, payments.
- Shares the same Google OAuth client ID and JWT auth as the [`mobile-app`](https://github.com/MyItinerary/myjourny).
- Supersedes the earlier `admin` repo (deprecated, different UI toolkit — shadcn/ui + Tailwind vs. this repo's Bootstrap/CoreUI). Don't port components 1:1 from it; expect a rewrite at the component layer.
