# Product Requirements

## Business Problem

Small resale operators need to know what is selling, what is stale, where profit is leaking, and what records should be exported for bookkeeping. Spreadsheet workflows make it hard to trace a sale back to item cost, photos, channel, payment, shipping, and event context.

## MVP Scope

- Email/password auth with first-run org creation.
- Mobile-first inventory CRUD with photo uploads.
- Unique item IDs by category and year.
- Multi-item sale flow that creates sale item records and marks items sold.
- Purchases, expenses, events, payments, and manual reconciliation.
- Reports for item, brand, material, item type, channel, aging, shipping, COGS, ending inventory, and sales tax aids.
- CSV and Excel exports.
- Excel import preview for the current inventory and accounting workbook structures.
- Firebase Hosting, Firestore, Storage, Auth, and emulator support.

## Non-Goals

- Server rendering.
- Marketplace posting automation.
- Direct Noihsaf, Facebook, Instagram, Venmo, or bank integrations.
- Legal or tax advice.
- Multi-org invitation flows beyond the underlying member model.

## User Workflows

- Sign up, create an org, and start adding inventory.
- Upload item photos, confirm AI suggestions, and save cost/listing data.
- Search or scan items into a sale cart, allocate sale price/fees/shipping, and complete the sale.
- Record purchases, expenses, events, and cash movements separately.
- Review reports and export data for bookkeeping.
- Import historical spreadsheet rows into a staged preview, then confirm writes.

## Future Phases

- Invite helpers and manage roles in the UI.
- Real OCR extraction for labels, receipts, and tags.
- Marketplace listing status sync.
- Automated payment import and bank reconciliation.
- Tax nexus and state-level sales tax workflows.
