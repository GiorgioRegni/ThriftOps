# Data Model

## Supabase/Prisma Models

- `Org`: org settings, owner, currency, sales tax settings.
- `Member`: role-based access by Firebase Auth UID.
- `Item`: every physical item, unique `itemCode`, photos, listing URLs, cost basis, status, source, and review flags.
- `Purchase`: receipt-level inventory purchase records.
- `Sale`: sale economics and payout matching status.
- `SaleItem`: one row per item sold, with snapshots and allocated profit.
- `Payment`: cash movement such as Venmo, PayPal, cash, payout, or bank deposit.
- `Expense`: non-sale expenses and linked receipt photos.
- `Event`: market/event records.
- `Listing`: channel listing records.

Firestore keeps only `orgs/{orgId}` and `orgs/{orgId}/members/{uid}` mirror documents so Firebase Storage rules can check membership.

## Relationships

Items can link to purchases, listings, sale items, expenses, and photos. Sales contain sale item subcollection docs. Payments are matched to one or more sales but are not treated as sales.

## Money Handling

All money fields are integer cents, for example `$12.34` is `1234`. No money value is stored as a floating point number.

## Date Handling

Persisted date fields use Postgres `DateTime` and are exposed to the frontend as ISO 8601 strings.
