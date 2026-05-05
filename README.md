# ThriftOps

ThriftOps is a mobile-first private operating system for a small clothing and home-goods resale business. It tracks every physical item with a unique ID, links sales to one or more item IDs, separates sale economics from cash movement, and exports bookkeeping data for accounting review.

## Tech Stack

- Vite, React, TypeScript, React Router
- Firebase Authentication, Firebase Storage, Firebase Hosting
- Node/Express REST API
- Prisma + Supabase Postgres for domain data
- Firebase Emulator Suite support
- Tailwind CSS
- Zod, React Hook Form-ready structure
- date-fns, papaparse, xlsx, qrcode, @zxing/browser
- Vitest

## Local Setup

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run api:dev
npm run dev
```

Set the Firebase, API, and `DATABASE_URL` values in `.env`. `DATABASE_URL` should point at Supabase Postgres or a local Postgres database. To use Firebase emulators for Auth/Storage/Firestore mirror rules:

```bash
VITE_USE_FIREBASE_EMULATORS=true npm run dev
npm run firebase:emulators
```

The emulator script passes `--project demo-thriftops`, so local emulator testing does not require a real Firebase project. The emulator suite uses non-default ports to avoid common local conflicts: Auth `17099`, Firestore `17080`, Firestore websocket `17150`, Storage `17199`, Hosting `17000`, Emulator UI `17400`, Hub `17440`, and Logging `17450`.

## Firebase Setup

1. Create a Firebase project.
2. Enable Email/Password Authentication.
3. Create a Firestore database for the minimal org/member mirror used by Storage rules.
4. Enable Firebase Storage.
5. Copy `.firebaserc.example` to `.firebaserc` and set your project ID.
6. Add the Vite env vars from your Firebase web app config.

## Commands

```bash
npm run dev
npm run build
npm run preview
npm run api:dev
npm run typecheck
npm run typecheck:api
npm run test
npm run lint
npm run prisma:generate
npm run prisma:migrate
npm run firebase:emulators
npm run firebase:deploy
```

`npm run build` creates `dist`. `firebase deploy` deploys hosting, Firestore rules/indexes, and Storage rules. Firebase Hosting rewrites SPA routes to `/index.html`. The API is deployed separately as a portable Node service.

## Data Model Overview

Domain data lives in Supabase Postgres through Prisma models for orgs, members, items, sales, sale items, purchases, expenses, payments, events, and listings. Money is stored as integer cents. Persisted dates are ISO strings over the REST API and `DateTime` in Postgres. Every item has an item code such as `W-2026-000001`; every sale writes sale item records and updates sold item status in one API transaction.

## Import Instructions

Use `/imports` to upload Excel workbooks. Supported inventory sheets are `Women`, `Women - Sold`, `Kids`, `Kids - SOLD`, `Home goods`, and `Home goods - Sold`. Supported accounting sheets include `2026 - Revenus`, `2026 - expenses`, `2025`, and `info`. Imports stage a preview with review flags before API writes.

## Known MVP Limitations

- AI/OCR extraction is stubbed.
- Marketplace auto-posting is not implemented.
- Noihsaf, Facebook, and Instagram integrations are not implemented.
- Venmo scraping is not implemented.
- Tax reports are bookkeeping aids, not tax or legal advice.
- Payment reconciliation is assisted and manual.
- QR scanning may require HTTPS or localhost depending on browser camera permissions.
- PWA icons are documented placeholders; replace them with real PNGs before production install testing.
