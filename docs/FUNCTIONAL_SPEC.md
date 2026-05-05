# ThriftOps Functional Specification

**Status:** Draft 0.1  
**Product:** ThriftOps  
**App type:** Firebase-hosted Vite + React + TypeScript web app  
**Primary device:** Mobile  
**Secondary device:** Desktop  
**Audience:** Small clothing resale business owner/operator

---

## 1. Product Summary

ThriftOps is a private, mobile-first operating system for a small resale business that sources second-hand clothing and home goods, primarily from thrift stores, then sells them through online marketplaces, social channels, direct payments, and in-person events.

The app replaces fragmented spreadsheets with a structured system for:

- inventory tracking
- purchase/sourcing tracking
- item photography
- listing preparation
- sale capture
- shipping cost tracking
- payment and payout reconciliation
- expense tracking
- accounting/tax exports
- resale performance analysis

The core design constraint is simplicity at the point of use. The seller should be able to add inventory and record sales quickly from a phone without needing to think like an accountant.

The core data constraint is correctness. Every physical item must have a unique ID, and every sale must link back to one or more item IDs.

---

## 2. Product Goals

### 2.1 Business Goals

The app should help answer:

- What categories, brands, materials, and item types sell best?
- What should we buy more of?
- What should we buy less of?
- What inventory is sitting too long?
- What sells quickly?
- How many multi-item sales or upsells are happening?
- Are we losing money on any items?
- Are we losing money on shipping?
- Which sales channels are most profitable?
- Which in-person events are worth repeating?
- What is the current value of active inventory?
- What should be exported for bookkeeping, accounting, and taxes?

### 2.2 User Experience Goals

The app should be:

- fast on mobile
- camera-first
- tolerant of incomplete information
- easy to correct later
- useful without heavy setup
- searchable
- exportable
- accurate enough for bookkeeping workflows

### 2.3 Technical Goals

The MVP should:

- run as a Firebase-hosted Vite React SPA
- use Firebase Auth, Firestore, and Storage
- support local development through Firebase emulators
- persist real user data, not just mock data
- support spreadsheet import/export
- keep accounting calculations deterministic and testable
- avoid fragile marketplace scraping

---

## 3. Non-Goals

The MVP is **not** intended to be:

- a full accounting system
- a replacement for tax software or a CPA
- a public multi-tenant SaaS product
- an automated marketplace scraper
- an automated Facebook Marketplace poster
- a Venmo transaction scraper
- a fully autonomous AI inventory system
- a complete ecommerce storefront
- a warehouse management system for large inventory operations

Marketplace publishing, advanced AI/OCR, checkout, and accounting software integrations are future phases.

---

## 4. Product Principles

### 4.1 One Physical Item = One Unique ID

Every sellable item gets a unique item code.

Examples:

- `W-2026-000001` for women
- `K-2026-000001` for kids
- `H-2026-000001` for home goods
- `U-2026-000001` for uncategorized

The item ID links:

- photos
- purchase/source record
- listing records
- sale records
- shipping costs
- item-level profit
- accounting exports

### 4.2 Sales and Payouts Are Separate

A sale is the economic event. A payout or payment is cash movement.

A Noihsaf payout, Venmo payment, PayPal transfer, cash count, or bank deposit should not be treated as the same thing as gross sales.

The app tracks both:

1. **Sale economics**
   - gross item subtotal
   - discount
   - shipping charged
   - sales tax collected
   - platform fee
   - payment fee
   - shipping cost
   - packaging cost
   - item cost basis
   - net profit

2. **Cash movement**
   - payment source
   - payment amount
   - payout amount
   - external transaction ID
   - matched sale IDs
   - reconciliation status

### 4.3 AI Suggests; Humans Confirm

AI/OCR may suggest item fields from photos, but it must not silently create final accounting records.

Examples of acceptable AI suggestions:

- brand
- item type
- size
- material
- color
- Goodwill tag price
- listing title
- description draft

The user must confirm suggestions before they become trusted data.

### 4.4 Incomplete Data Is Allowed, but Flagged

The app should not block normal work because a field is missing. Instead, it should create review flags.

Examples:

- missing cost
- missing sale price
- missing acquired date
- missing sold date
- ambiguous import row
- negative profit
- unmatched payment

### 4.5 Money Must Be Exact

All monetary values are stored as integer cents.

Examples:

- `$12.34` -> `1234`
- `$0.00` -> `0`
- `-$5.50` -> `-550`

Floating point money values must not be stored in Firestore.

---

## 5. Users and Roles

### 5.1 Primary Persona: Seller / Owner

The main user buys, photographs, lists, sells, ships, and tracks items.

Needs:

- fast mobile entry
- photo upload
- easy selling flow
- quick reports
- exportable bookkeeping data

### 5.2 Admin / Spouse / Operator

A second trusted user may help maintain data, fix imports, run exports, or analyze performance.

Needs:

- desktop-friendly reporting
- import/export tools
- reconciliation tools
- settings access

### 5.3 Helper

A helper may assist at events or with inventory entry.

Needs:

- add items
- sell items
- view inventory
- limited access to settings

### 5.4 Viewer

Read-only access for accountants, reviewers, or future collaborators.

Needs:

- reports
- exports if permitted
- no ability to mutate core records

---

## 6. Roles and Permissions

| Role | Read Records | Create/Edit Records | Delete Records | Manage Members | Manage Settings | Export Data |
|---|---:|---:|---:|---:|---:|---:|
| Owner | Yes | Yes | Yes | Yes | Yes | Yes |
| Admin | Yes | Yes | Yes | Yes | Yes | Yes |
| Member | Yes | Yes | Limited/No | No | No | Yes |
| Viewer | Yes | No | No | No | No | Optional |

Deletion should be soft-delete where practical. Financial records should generally be voided or corrected rather than hard-deleted.

---

## 7. Supported Platforms

### 7.1 MVP Platforms

- Mobile Safari
- Mobile Chrome
- Desktop Chrome
- Desktop Safari
- Desktop Firefox

### 7.2 Form Factor Priorities

1. Mobile phone for item entry, selling, photos, and quick lookup
2. Desktop browser for reporting, imports, exports, and cleanup
3. Tablet support as a natural result of responsive design

### 7.3 PWA Behavior

The app should be PWA-ready:

- installable manifest
- app icon placeholders
- responsive layout
- future offline support

Offline-first behavior is not required for MVP, but the UX should not assume permanent desktop connectivity.

---

## 8. Information Architecture

Primary routes:

- `/login`
- `/onboarding`
- `/`
- `/inventory`
- `/inventory/new`
- `/inventory/:itemId`
- `/sell`
- `/sales`
- `/purchases`
- `/expenses`
- `/events`
- `/reconciliation`
- `/reports`
- `/imports`
- `/settings`

Primary navigation:

- Dashboard
- Inventory
- Add Item
- Sell
- Reports

Secondary navigation:

- Sales
- Purchases
- Expenses
- Events
- Reconciliation
- Imports
- Settings

---

## 9. Core Domain Objects

### 9.1 Organization

An organization represents one resale business or household business account.

Key fields:

- organization name
- owner user ID
- default currency
- tax settings
- item ID settings
- created/updated timestamps

### 9.2 Member

A member is a user associated with an organization.

Key fields:

- user ID
- email
- display name
- role
- created/updated timestamps

### 9.3 Item

An item is a physical sellable object.

Examples:

- sweater
- linen top
- denim jacket
- children's dress
- ceramic bowl

An item has:

- unique item code
- category
- status
- brand
- item type
- size
- material
- cost basis
- photos
- source details
- listing details
- sale state
- review flags

### 9.4 Purchase

A purchase is a sourcing event, usually from Goodwill or another vendor.

Examples:

- Goodwill trip
- estate sale
- bulk lot
- donation intake

A purchase may link to many items.

### 9.5 Listing

A listing represents an item being listed for sale on a channel.

Examples:

- Noihsaf listing
- Facebook Marketplace listing
- Instagram post
- own website listing

A listing may have:

- channel
- title
- description
- list price
- URL
- status
- listing date

### 9.6 Sale

A sale is a transaction where one or more items are sold.

A sale has:

- sale date
- channel
- buyer/payment information
- item subtotal
- discount
- shipping charged
- sales tax collected
- fees
- actual shipping cost
- payment status

### 9.7 Sale Item

A sale item links a specific sold item to a sale.

It stores item snapshots and allocated economics so historical reporting remains stable even if the item record changes later.

### 9.8 Payment

A payment represents received or imported cash movement.

Examples:

- Venmo payment
- PayPal payment
- Noihsaf payout
- cash count
- bank deposit

Payments can be matched to one or more sales.

### 9.9 Expense

An expense represents a business cost.

Examples:

- shipping labels
- packaging
- market booth fee
- cleaning/repair
- supplies
- software
- mileage
- payment fees
- platform fees

### 9.10 Event

An event is an in-person selling event or market.

An event can have:

- booth fee
- location
- sales
- items brought
- event-level profitability

---

## 10. Item Lifecycle

### 10.1 Item Statuses

| Status | Meaning |
|---|---|
| `draft` | Item was started but is not ready for inventory/listing |
| `active` | Item is in inventory but not necessarily listed |
| `listed` | Item is actively listed on at least one channel |
| `reserved` | Item is held for a buyer or event |
| `sold` | Item has been sold |
| `donated` | Item was removed and donated |
| `lost` | Item cannot be found |
| `returned` | Item was sold and then returned |

### 10.2 Allowed Status Transitions

| From | To |
|---|---|
| draft | active, listed, donated, lost |
| active | listed, reserved, sold, donated, lost |
| listed | reserved, sold, active, donated, lost |
| reserved | listed, active, sold, donated, lost |
| sold | returned |
| returned | active, listed, donated, lost |
| donated | active only with admin override |
| lost | active only with admin override |

The app should allow correction workflows, but they should be visible and auditable.

---

## 11. Authentication and Onboarding

### 11.1 Authentication

MVP authentication supports:

- email/password signup
- email/password login
- logout
- protected routes

Future authentication may support:

- Google login
- magic links
- multi-factor authentication

### 11.2 First-Run Onboarding

If an authenticated user has no organization, the app prompts them to create one.

Required fields:

- business name
- home state
- whether to track sales tax

On submit:

- create organization
- create member record for the user
- assign role `owner`
- route to dashboard

### 11.3 Active Organization

The app should support an active organization context even if MVP only uses one organization per user.

---

## 12. Dashboard

### 12.1 Purpose

The dashboard gives a fast operating summary and entry points for common work.

### 12.2 Period Filter

Supported date ranges:

- this month
- last month
- last 30 days
- this year
- custom range

MVP can start with this month and this year.

### 12.3 Key Metrics

Dashboard cards:

| Metric | Definition |
|---|---|
| Gross sales | Sum of gross item subtotal for sales in selected period |
| Estimated net profit | Gross sales + shipping charged - discounts - COGS - fees - shipping costs - packaging - other allocated costs |
| Active inventory value | Sum of cost basis for draft/active/listed/reserved items |
| Items sold | Count of sale items in selected period |
| Average order value | Gross sales / number of sales |
| Multi-item sale rate | Sales with 2+ items / total sales |
| Shipping profit/loss | Shipping charged - actual shipping cost - packaging cost |
| Stale inventory count | Active/listed/reserved items older than selected stale threshold |
| Unmatched payments | Count of payments not fully matched to sales |

### 12.4 Dashboard Sections

- recent sales
- inventory snapshot
- review warnings
- stale inventory preview
- unmatched payments preview
- quick actions

### 12.5 Quick Actions

- Add item
- Sell item
- New purchase
- New expense
- Import spreadsheet
- Export data

---

## 13. Inventory

### 13.1 Inventory List

The inventory screen shows all items the user has permission to view.

Each item card should show:

- primary photo
- item code
- brand
- item type/title
- size
- material
- cost basis
- current list price if available
- status
- days held
- review flags

### 13.2 Search

Search should match:

- item code
- brand
- title
- item type
- size
- material
- color
- notes
- listing URL

### 13.3 Filters

Supported filters:

- status
- category
- brand
- item type
- material
- size
- condition
- source vendor
- source location
- storage location
- stale bucket
- review flag

### 13.4 Sorting

Supported sorting:

- newest acquired
- oldest acquired
- recently updated
- stale first
- highest cost basis
- highest list price
- brand A-Z
- item type A-Z

### 13.5 Bulk Actions

MVP may include limited bulk actions:

- export selected
- mark active
- mark listed
- mark donated
- assign storage location

Destructive bulk actions require confirmation.

---

## 14. Add Item

### 14.1 Purpose

The add item flow must be optimized for mobile sourcing and post-sourcing intake.

### 14.2 Entry Points

An item can be added from:

- global Add button
- inventory screen
- purchase detail screen
- import workflow

### 14.3 Required Fields

Minimum required fields for a trusted item:

- category
- item type or title
- cost basis
- acquired date

However, the app may allow saving as `draft` if required fields are missing.

### 14.4 Recommended Fields

- brand
- size
- material
- color
- condition
- source vendor
- source location
- storage location
- current list price
- photos
- notes

### 14.5 Photo Types

Supported photo categories:

- front
- back
- brand tag
- size/fabric tag
- price tag
- flaw
- other

### 14.6 Camera Behavior

On mobile, file inputs should support camera capture where the browser allows it.

Photos are uploaded to Firebase Storage under organization-scoped paths.

### 14.7 AI/OCR Suggestions

MVP includes an AI extraction interface, but the actual extraction may be stubbed.

Expected future inputs:

- front photo
- brand tag photo
- size/fabric tag photo
- price tag photo

Expected outputs:

- brand
- item type
- size
- material
- color
- condition hints
- cost basis
- suggested title
- suggested listing price
- confidence per field

The user must review and accept suggestions before they are saved.

### 14.8 Item Code Generation

On create:

- determine prefix from category
- determine current year from acquired date or current date
- increment sequence within org/category/year
- assign item code

Example:

`W-2026-000123`

Item code generation must avoid duplicates.

---

## 15. Item Detail

### 15.1 Purpose

The item detail page is the source of truth for one physical item.

### 15.2 Display Sections

- photo gallery
- item identity
- status
- financial summary
- purchase/source info
- listing info
- sale info if sold
- storage location
- measurements
- review flags
- notes
- timeline/activity history if available

### 15.3 Actions

Supported actions:

- edit item
- upload photos
- generate QR label
- mark active
- mark listed
- add listing URL
- reserve item
- mark sold
- mark donated
- mark lost
- duplicate as template

### 15.4 QR Label

The QR label should include:

- QR code
- item code
- brand
- short title or item type
- optional cost/list price if enabled

The QR code may encode:

- item code, or
- app deep link to item detail

MVP can encode the item code.

---

## 16. Purchases and Sourcing Trips

### 16.1 Purpose

Purchases track how inventory entered the business.

### 16.2 Purchase Fields

- date
- vendor
- location
- total
- subtotal
- tax
- payment method/account
- receipt photos
- notes
- allocation mode
- linked item IDs

### 16.3 Allocation Modes

| Mode | Behavior |
|---|---|
| Exact | Each item has its own known cost |
| Equal | Purchase total is split evenly across linked items |
| Manual | User manually assigns cost per item |
| Unallocated | Purchase is saved without complete item cost allocation |

### 16.4 Allocation Validation

The purchase detail should show:

- receipt total
- allocated total
- unallocated amount
- overallocated amount if any

If allocation does not match total, the purchase gets a review flag.

### 16.5 Add Items From Purchase

From a purchase screen, the user can add multiple items. Newly created items are linked to the purchase.

---

## 17. Listings

### 17.1 Purpose

Listings track where an item is offered for sale.

### 17.2 Supported Channels

- Noihsaf
- Facebook Marketplace
- Instagram
- own website
- in-person market
- other

### 17.3 Listing Fields

- item ID
- channel
- title
- description
- list price
- listing URL
- status
- listed date
- ended date

### 17.4 Listing Statuses

| Status | Meaning |
|---|---|
| draft | Listing is prepared but not published |
| active | Listing is live |
| sold | Listing resulted in sale |
| ended | Listing was ended or removed |
| deleted | Listing was deleted |

### 17.5 Marketplace Automation Boundary

MVP does not auto-post to marketplaces.

MVP may provide:

- generated listing title
- generated listing description
- copy-to-clipboard
- image export/download
- listing URL storage

---

## 18. Sell Flow

### 18.1 Purpose

The sell flow must make recording an in-person or online sale fast and accurate.

### 18.2 Entry Points

A sale can be started from:

- global Sell button
- item detail page
- event page
- inventory search
- QR scan

### 18.3 Sale Cart

The user can add one or more items to a cart.

Each cart line includes:

- item code
- photo
- brand/title
- cost basis
- sale price
- optional item-level discount

### 18.4 Sale Fields

Required:

- sold date
- channel
- payment method
- at least one item
- sale price allocation per item

Optional:

- event
- buyer name/contact
- discount
- shipping charged
- sales tax collected
- marketplace collected tax toggle
- platform fee
- payment fee
- actual shipping cost
- packaging cost
- other cost
- notes
- proof photo

### 18.5 Sale Channels

- in-person market
- Noihsaf
- Facebook Marketplace
- Instagram
- own website
- Venmo direct
- PayPal direct
- cash
- other

### 18.6 Payment Methods

- cash
- Venmo
- PayPal
- Stripe
- card
- marketplace payout
- other

### 18.7 Sale Submission Behavior

On submit, the app must:

1. validate the sale
2. create sale document
3. create sale item records
4. compute item-level economics
5. update each item to `sold`
6. set each item's `soldAt`
7. link sale to event if provided
8. set payout status
9. show sale summary

This should be implemented as a Firestore batch or transaction where practical.

### 18.8 Duplicate Sale Protection

The app should prevent selling the same item twice unless a correction workflow explicitly reopens it.

If a selected item is already sold, the UI should block submission and show a clear error.

---

## 19. Sales

### 19.1 Sales List

The sales list supports:

- date range filter
- channel filter
- payment method filter
- payout status filter
- event filter
- multi-item only filter

Each row/card shows:

- sale date
- channel
- gross amount
- net profit estimate
- number of items
- payout status

### 19.2 Sale Detail

Sale detail shows:

- sale metadata
- items sold
- gross subtotal
- discount
- shipping charged
- sales tax collected
- fees
- actual shipping cost
- packaging cost
- COGS
- net profit
- payment matching status
- proof photos
- notes

### 19.3 Corrections

Financial corrections should be possible, but the app should preserve enough information to understand what changed.

MVP can allow editing sale fields directly and recalculating reports.

Future versions should keep an audit log.

---

## 20. Payments and Reconciliation

### 20.1 Purpose

Reconciliation connects cash movement to recorded sales.

### 20.2 Payment Sources

- Venmo
- PayPal
- Noihsaf
- Stripe
- cash
- bank
- other

### 20.3 Payment Fields

- date
- source
- amount
- external transaction ID
- counterparty
- note
- matched sale IDs
- status
- import source

### 20.4 Payment Statuses

| Status | Meaning |
|---|---|
| unmatched | Payment is not linked to any sale |
| partially_matched | Payment is linked but amount does not fully reconcile |
| matched | Payment is fully reconciled |

### 20.5 Matching Suggestions

The app should suggest matches using:

- exact amount match
- same payment method/source
- sale date within +/-3 days
- buyer/counterparty note if available
- marketplace channel consistency

### 20.6 Reconciliation Actions

The user can:

- create payment manually
- import payment rows
- match one payment to one sale
- match one payment to multiple sales
- unmatch payment
- mark sale as not applicable for payout matching

### 20.7 Payouts vs Gross Sales

For marketplace payouts, the payout may be net of fees, shipping, taxes, or timing differences. The system must preserve both the sale record and payout/payment record.

---

## 21. Expenses

### 21.1 Purpose

Expenses track business costs that may not be directly captured in a sale.

### 21.2 Expense Categories

- inventory purchase
- shipping
- packaging
- market booth fee
- cleaning/repair
- software
- mileage
- supplies
- payment fee
- platform fee
- other

### 21.3 Expense Fields

- date
- category
- vendor
- amount
- payment method
- linked item
- linked sale
- linked purchase
- receipt photos
- tax deductible flag
- notes

### 21.4 Expense Rules

Expenses linked directly to sales or items should be included in item/channel profitability when appropriate.

General expenses should appear in bookkeeping exports but may not be allocated to item-level profit in MVP.

---

## 22. Events

### 22.1 Purpose

Events track in-person markets and pop-ups.

### 22.2 Event Fields

- name
- date
- location
- booth fee
- notes
- optional items brought

### 22.3 Event Metrics

For each event, show:

- gross sales
- item count sold
- transaction count
- average order value
- multi-item sale rate
- COGS
- fees
- booth fee
- profit before booth fee
- profit after booth fee
- best categories
- best item types
- payment method mix

### 22.4 Event Workflow

At an event, the seller should be able to:

- open event
- sell item
- scan/search item
- record cash/Venmo/card payment
- see event sales total

Full offline event mode is future scope.

---

## 23. Reports

### 23.1 Report Requirements

Reports should be based on persisted Firestore data and deterministic calculations.

Reports should support:

- date range selection where relevant
- CSV export
- Excel export where practical
- drilldown to underlying records

### 23.2 Profit by Item

Columns:

- item code
- brand
- item type
- category
- cost basis
- sold price
- discount
- platform fee
- payment fee
- shipping charged
- shipping cost
- packaging cost
- net profit
- margin
- days held
- days listed
- channel
- sold date

### 23.3 Profit by Brand

Grouped by brand.

Columns:

- brand
- active count
- sold count
- gross sales
- COGS
- fees
- shipping profit/loss
- net profit
- average profit per sold item
- average sale price
- sell-through proxy
- median days held

### 23.4 Profit by Material

Grouped by material.

Used to evaluate natural-fabric sourcing strategy.

Columns mirror Profit by Brand.

### 23.5 Profit by Item Type

Grouped by item type.

Examples:

- sweater
- blouse
- dress
- jeans
- coat
- shoes
- bowl

Columns mirror Profit by Brand.

### 23.6 Profit by Size

Grouped by size.

Useful for deciding what sizes to source more or less often.

Columns:

- size
- active count
- sold count
- gross sales
- net profit
- average profit
- sell-through proxy
- median days held

### 23.7 Channel Profitability

Grouped by sales channel.

Columns:

- channel
- transaction count
- item count sold
- gross sales
- discounts
- shipping charged
- platform fees
- payment fees
- shipping cost
- packaging cost
- COGS
- net profit
- margin
- average order value

### 23.8 Aging Report

Buckets:

- 0-30 days
- 31-60 days
- 61-90 days
- 91-180 days
- 180+ days

For each bucket:

- item count
- total cost basis
- average cost basis
- top brands
- top item types
- suggested action

Suggested actions:

- leave alone
- monitor
- consider markdown
- re-photo/relist
- bring to market
- clearance/donate

### 23.9 Shipping Report

Columns:

- sale ID
- channel
- shipping charged
- actual shipping cost
- packaging cost
- shipping profit/loss
- item count
- sold date

Aggregates:

- total shipping charged
- total actual shipping
- total packaging
- net shipping profit/loss
- average shipping loss per shipped sale

### 23.10 COGS Report

For selected date range:

- sold item count
- gross sales
- total cost basis of sold items
- COGS
- estimated net profit

### 23.11 Ending Inventory Report

As of selected date:

- active inventory count
- active inventory cost basis
- by category
- by brand
- by item type
- by material
- by source location

### 23.12 Sales Tax Report

For selected date range:

- taxable direct sales
- direct sales tax collected
- marketplace-collected sales
- marketplace-collected tax indicator
- sales by jurisdiction if available

MVP does not calculate tax filings. It provides organized data.

### 23.13 Event Report

For each event:

- gross sales
- item count sold
- transaction count
- average order value
- multi-item sale rate
- COGS
- booth fee
- net profit after booth fee
- top item types
- top brands
- payment method mix

### 23.14 Data Quality Report

Shows records needing review.

Groups:

- items missing cost
- items missing brand
- sold items missing sale price
- sold items missing sold date
- purchases with unallocated cost
- unmatched payments
- negative profit items
- missing receipt photos

---

## 24. Business Calculations

### 24.1 Sale-Level Net Profit

```text
sale_net_profit =
  gross_item_subtotal
  - discount
  + shipping_charged
  - platform_fee
  - payment_fee
  - actual_shipping_cost
  - packaging_cost
  - other_cost
  - sum(cost_basis of sold items)
  - allocated_event_fee
```

### 24.2 Sale Item Net Profit

```text
sale_item_net_profit =
  allocated_sale_price
  - allocated_discount
  - cost_basis
  - allocated_platform_fee
  - allocated_payment_fee
  - allocated_shipping_cost
  - allocated_packaging_cost
  - allocated_event_fee
```

### 24.3 Active Inventory Value

```text
active_inventory_value =
  sum(cost_basis for items where status in draft, active, listed, reserved)
```

### 24.4 COGS

```text
COGS = sum(cost_basis for sold items where sold_at is in selected period)
```

### 24.5 Days Held

```text
days_held = sold_at - acquired_at
```

For unsold items:

```text
days_held = today - acquired_at
```

### 24.6 Days Listed

```text
days_listed = sold_at - listed_at
```

For currently listed items:

```text
days_listed = today - listed_at
```

### 24.7 Multi-Item Sale Rate

```text
multi_item_sale_rate = sales_with_two_or_more_items / total_sales
```

### 24.8 Average Order Value

```text
average_order_value = gross_sales / number_of_sales
```

### 24.9 Average Item Sale Price

```text
average_item_sale_price = gross_item_subtotal / number_of_sold_items
```

### 24.10 Shipping Profit/Loss

```text
shipping_profit_loss = shipping_charged - actual_shipping_cost - packaging_cost
```

### 24.11 Sell-Through Proxy

```text
sell_through_proxy = sold_count / (sold_count + active_count + listed_count + reserved_count)
```

This is a proxy until the system has complete historical acquisition/listing data.

### 24.12 Margin

```text
margin = net_profit / gross_sales
```

Handle division by zero safely.

---

## 25. Review Flags

### 25.1 Item Review Flags

- `missing_cost`
- `missing_brand`
- `missing_item_type`
- `missing_acquired_date`
- `missing_photo`
- `missing_size`
- `missing_material`
- `ambiguous_import_row`
- `duplicate_possible`
- `stale_90_days`
- `stale_180_days`

### 25.2 Sale Review Flags

- `missing_sale_price`
- `missing_sold_date`
- `negative_profit`
- `shipping_loss`
- `missing_payment_method`
- `unmatched_payment`
- `sold_item_missing_cost`

### 25.3 Purchase Review Flags

- `missing_receipt`
- `unallocated_cost`
- `overallocated_cost`
- `missing_vendor`
- `missing_purchase_date`

### 25.4 Import Review Flags

- `unknown_sheet`
- `unknown_column`
- `missing_required_column`
- `unparsed_money`
- `unparsed_date`
- `ambiguous_event_or_date`
- `duplicate_row_possible`

---

## 26. Imports

### 26.1 Import Principles

Imports should be safe and reversible where practical.

The import process must:

1. upload or read file
2. detect workbook sheets
3. map known columns
4. show preview
5. show warnings and review flags
6. require explicit confirmation
7. write records with import metadata

### 26.2 Inventory Workbook Import

Known sheets:

- `Women`
- `Women - Sold`
- `Kids`
- `Kids - SOLD`
- `Home goods`
- `Home goods - Sold`

Mapping:

| Sheet | Category | Status |
|---|---|---|
| Women | women | active |
| Women - Sold | women | sold |
| Kids | kids | active |
| Kids - SOLD | kids | sold |
| Home goods | home_goods | active |
| Home goods - Sold | home_goods | sold |

Known columns:

| Spreadsheet Column | App Field |
|---|---|
| Brand | brand |
| what? | itemType/title |
| size | size |
| cost | costBasisCents |
| Sold | sale price or sold amount |
| Shipping | shipping amount |
| Benefice net | legacy profit note/import metadata |
| Event / Market price | event/date/channel/import metadata |
| Link | listing URL |

Import behavior:

- generate item IDs
- preserve original row data
- create review flags for missing or ambiguous fields
- sold sheets may create sold items and provisional sale records when enough data exists
- rows without enough sale detail remain imported as sold items with review flags

### 26.3 Accounting Workbook Import

Known sheets:

- `2026 - Revenus`
- `2026 - expenses`
- `2025`
- `info`

Import behavior:

- revenue rows become payment/import records where possible
- expense rows become expense records where possible
- unsupported rows are staged for review
- original rows are preserved as metadata

### 26.4 Import Metadata

Imported records should include:

- import run ID
- workbook name
- sheet name
- source row number
- original row JSON
- imported at
- imported by
- review flags

---

## 27. Exports

### 27.1 Export Principles

The user should be able to leave the system with their data.

Exports should be simple, readable, and useful for bookkeeping.

### 27.2 Supported Export Formats

- CSV
- Excel workbook
- JSON backup

PDF is optional/future.

### 27.3 Standard CSV Exports

- items
- sales
- sale items
- purchases
- expenses
- payments
- events
- listings

### 27.4 Excel Workbook Export

One workbook with sheets:

- Active Inventory
- Sold Inventory
- Sales
- Sale Items
- Purchases
- Expenses
- Payments
- Events
- Listings
- Profit by Brand
- Profit by Material
- Profit by Item Type
- Channel Profitability
- Aging
- COGS
- Ending Inventory
- Sales Tax
- Review Flags

### 27.5 CPA Package

Future export package:

- Excel summary workbook
- receipt images
- categorized expenses
- inventory valuation
- COGS report
- unmatched payment report

---

## 28. Settings

### 28.1 Organization Settings

- business name
- default currency
- home state
- sales tax tracking enabled/disabled
- default sales tax rate in basis points

### 28.2 Item ID Settings

- category prefixes
- sequence behavior
- current sequence counters

### 28.3 Channel Settings

Allow user to manage known channels:

- Noihsaf
- Facebook Marketplace
- Instagram
- own website
- in-person market
- other

Future channel settings may include fee defaults.

### 28.4 Source Settings

Allow user to manage common sourcing locations:

- Goodwill Downtown
- Goodwill Outlet
- estate sale
- donation
- other

### 28.5 User Management

Owner/admin can:

- view members
- invite member placeholder
- change roles
- remove members

Full invite flow can be future scope.

---

## 29. Validation Rules

### 29.1 Item Validation

Trusted active/listed item should have:

- category
- item type or title
- cost basis
- acquired date

If missing, allow save as draft or save with review flags.

### 29.2 Sale Validation

A sale must have:

- at least one item
- sale date
- channel
- payment method
- allocated sale price for each item

A sale must not include an item already marked sold unless correction mode is explicitly active.

### 29.3 Purchase Validation

A purchase should have:

- date
- vendor
- total amount

If linked items do not allocate to the total, add a review flag.

### 29.4 Expense Validation

An expense must have:

- date
- category
- amount

Receipt is recommended but not required.

### 29.5 Payment Validation

A payment must have:

- date
- source
- amount

If not matched, it remains `unmatched`.

---

## 30. Error Handling

### 30.1 General UX

Every screen should handle:

- loading state
- empty state
- permission denied state
- validation errors
- failed network request
- failed image upload

### 30.2 Failed Firestore Write

Show a clear error and keep user-entered form data in place.

### 30.3 Failed Image Upload

The item should not lose form data. User can retry photo upload or save item without photo and receive a review flag.

### 30.4 Import Failure

Import should fail safely before writing if parsing fails. Partial writes should be avoided or clearly marked by import run ID.

---

## 31. Security and Privacy

### 31.1 Authentication

All app data requires authenticated access.

### 31.2 Organization Isolation

Users can access only organizations where they have a member record.

### 31.3 Storage Isolation

Uploaded files are stored under organization-scoped paths.

Examples:

- `orgs/{orgId}/items/{itemId}/photos/{fileName}`
- `orgs/{orgId}/purchases/{purchaseId}/receipts/{fileName}`
- `orgs/{orgId}/expenses/{expenseId}/receipts/{fileName}`
- `orgs/{orgId}/sales/{saleId}/proof/{fileName}`

### 31.4 Sensitive Data

The app should avoid storing unnecessary buyer personal data.

Buyer fields are optional.

---

## 32. Performance Requirements

### 32.1 Mobile Performance

The app should feel fast on a modern phone.

Guidelines:

- lazy-load heavy routes where practical
- compress/resize images before or during upload if implemented
- paginate large lists
- avoid loading all photos in full resolution
- use thumbnails where possible

### 32.2 Firestore Query Constraints

Inventory and reports should avoid unbounded expensive reads once data grows.

MVP can compute many reports client-side for small datasets, but the service layer should keep report logic isolated so it can move to Cloud Functions or scheduled aggregates later.

---

## 33. Accessibility Requirements

The UI should include:

- semantic buttons and labels
- visible focus states
- accessible form labels
- sufficient color contrast
- non-color-only status indicators
- large tap targets on mobile
- keyboard-friendly desktop workflows

---

## 34. MVP Acceptance Criteria

The MVP is complete when:

1. User can sign up, sign in, and sign out.
2. Authenticated user can create an organization.
3. Protected routes require authentication.
4. User can add an inventory item.
5. User can upload item photos.
6. User can view, search, filter, and sort inventory.
7. User can edit item details.
8. User can generate or view an item QR label.
9. User can create a purchase.
10. User can link items to purchases.
11. User can create an expense.
12. User can create an event.
13. User can sell one item.
14. User can sell multiple items in one sale.
15. Sold items update to status `sold`.
16. Sale item records are created.
17. Net profit is calculated from sale price, cost basis, fees, and shipping.
18. User can view sales list and sale detail.
19. User can create payment records.
20. User can match payments to sales.
21. Dashboard shows real metrics from persisted data.
22. Reports show real aggregated data.
23. CSV export works for core records.
24. Excel export works for core reports.
25. Inventory spreadsheet import preview works.
26. Accounting spreadsheet import preview works.
27. Import requires confirmation before writing.
28. Firestore rules deny unauthenticated access.
29. Storage rules deny unauthenticated access.
30. Firebase Hosting serves the Vite app as an SPA.
31. Typecheck, tests, and build pass.

---

## 35. Future Phases

### 35.1 Phase 2: Better AI Intake

- OCR price tags
- OCR brand/size/fabric tags
- AI material classification
- AI listing title and description generation
- confidence scores
- field-level accept/reject

### 35.2 Phase 3: Listing Automation

- image crop/cleanup
- watermarking
- listing templates
- copy-to-clipboard per channel
- Instagram publishing through official APIs where available
- own website publishing

### 35.3 Phase 4: Ecommerce and Checkout

- own store catalog
- checkout
- payment processing
- inventory sync
- order management

### 35.4 Phase 5: Advanced Reconciliation

- CSV import from payment platforms
- payout batch matching
- bank deposit matching
- reconciliation exceptions dashboard

### 35.5 Phase 6: Recommendation Engine

- buy-more/buy-less recommendations
- markdown recommendations
- event packing recommendations
- stale item action recommendations
- brand/material performance scoring

### 35.6 Phase 7: Accounting Integrations

- QuickBooks export/import
- Xero export/import
- year-end CPA package
- receipt archive zip

### 35.7 Phase 8: Offline Event Mode

- local sale queue
- offline inventory lookup
- conflict resolution
- sync when connection returns

---

## 36. Open Questions

These should be resolved before or during implementation:

1. Should item codes be printed physically, or only stored digitally at first?
2. Should purchase tax be included in item cost basis by default?
3. Should event booth fees be allocated across sold items or treated only at event/report level?
4. Should shipping supplies be allocated per sale or tracked as general expense?
5. What are the primary item categories beyond women, kids, and home goods?
6. Should direct sales tax be calculated automatically or manually entered?
7. Should imported historical sold rows create synthetic sale records automatically?
8. What is the minimum required data for an item to be considered `active`?
9. Should helpers be allowed to see financial reports?
10. How important is offline event support for the first usable version?

---

## 37. Implementation Notes

### 37.1 Recommended MVP Bias

Prefer a simple, reliable workflow over a magical one.

Good MVP behavior:

- user adds item manually
- app stores photos and cost basis
- user sells item through a fast cart
- app calculates profit
- reports expose patterns

Risky premature behavior:

- AI silently creates records from photos
- browser automation posts to marketplaces
- payment screenshots become accounting truth
- payouts are treated as gross revenue

### 37.2 Data Correction Philosophy

People will make mistakes during busy sourcing trips and markets. The system should make correction easy, but keep enough metadata to understand the correction later.

### 37.3 Reporting Philosophy

Reports should be boring and trusted. Fancy charts are less important than correct totals, clear filters, and exportability.

---
