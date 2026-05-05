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
make dev
```

Set the Firebase, backend, `ADMIN_EMAILS`, and `DATABASE_URL` values in `.env`. `DATABASE_URL` should point at Supabase Postgres or a local Postgres database. The frontend always calls same-origin `/api`; Vite proxies `/api` to the local backend in development, and Firebase Hosting rewrites `/api/**` to Cloud Run in production. To use Firebase emulators for Auth/Storage/Firestore mirror rules:

```bash
VITE_USE_FIREBASE_EMULATORS=true npm run dev
npm run firebase:emulators
```

The emulator script passes `--project demo-thriftops`, so local emulator testing does not require a real Firebase project. The emulator suite uses non-default ports to avoid common local conflicts: Auth `17099`, Firestore `17080`, Firestore websocket `17150`, Storage `17199`, Hosting `17000`, Emulator UI `17400`, Hub `17440`, and Logging `17450`.

`ADMIN_EMAILS` is a comma-separated list of full-admin Firebase account emails. It defaults to `giorgio@3i7.net`.

Locally, the API requires Firebase Admin service account credentials for token verification and Firestore mirror writes. Set `FIREBASE_SERVICE_ACCOUNT_PATH` to a downloaded Firebase service account JSON file, or set `FIREBASE_SERVICE_ACCOUNT_JSON` to the JSON content. In Cloud Run, the API uses Application Default Credentials from the attached runtime service account.

## Firebase Setup

1. Create a Firebase project.
2. Enable Email/Password Authentication and Google Authentication.
3. Create a Firestore database for the minimal org/member mirror used by Storage rules.
4. Enable Firebase Storage.
5. Copy `.firebaserc.example` to `.firebaserc` and set your project ID.
6. Add the Vite env vars from your Firebase web app config.

## Commands

```bash
npm run dev
make dev
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
make firebase-deploy
make firebase-deploy-hosting
make firebase-deploy-firestore
make firebase-deploy-storage
make cloud-run-deploy
```

`npm run build` creates `dist`. `firebase deploy` deploys hosting, Firestore rules/indexes, and Storage rules. Firebase Hosting rewrites `/api/**` to the Cloud Run API and SPA routes to `/index.html`.

The `make firebase-*` targets load `.env` automatically and pass `FIREBASE_SERVICE_ACCOUNT_PATH` to Firebase CLI as `GOOGLE_APPLICATION_CREDENTIALS`.

## Cloud Run API Deployment

The production API runs as a Cloud Run service named `thriftops-api` by default. Store the Supabase Postgres URL in Secret Manager before deploying:

```bash
printf '%s' "$DATABASE_URL" | gcloud secrets create thriftops-database-url --data-file=- --project "$FIREBASE_PROJECT_ID"
```

Grant the Cloud Run runtime service account access to the database secret and the Firebase/Firestore mirror resources:

```bash
gcloud secrets add-iam-policy-binding thriftops-database-url \
  --project "$FIREBASE_PROJECT_ID" \
  --member "serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role roles/secretmanager.secretAccessor

gcloud projects add-iam-policy-binding "$FIREBASE_PROJECT_ID" \
  --member "serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role roles/datastore.user
```

Set production deploy values in `.env`, especially `API_ALLOWED_ORIGIN` for the Firebase Hosting origin, then deploy the API and Hosting rewrite:

```bash
make cloud-run-deploy
make firebase-deploy-hosting
```

## Data Model Overview

Domain data lives in Supabase Postgres through Prisma models for orgs, members, items, sales, sale items, purchases, expenses, payments, events, and listings. Money is stored as integer cents. Persisted dates are ISO strings over the REST API and `DateTime` in Postgres. Every item has an item code such as `W-2026-000001`; every sale writes sale item records and updates sold item status in one API transaction.

## Product Docs

- [Functional specification](docs/FUNCTIONAL_SPEC.md)
- [PRD](docs/PRD.md)
- [Data model](docs/DATA_MODEL.md)
- [Accounting notes](docs/ACCOUNTING_NOTES.md)
- [Import mapping](docs/IMPORT_MAPPING.md)

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
