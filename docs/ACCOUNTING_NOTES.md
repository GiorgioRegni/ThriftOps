# Accounting Notes

## Gross Sales vs Payouts

Sales and payouts are different records. A sale captures economic activity: gross item subtotal, shipping charged, sales tax collected, fees, COGS, shipping cost, packaging, other costs, and estimated net profit. A payout or Venmo/cash/bank movement is recorded as a payment and reconciled later.

## COGS

COGS is the sum of sold item cost basis for the selected date range. Cost basis is stored on items and snapshotted into sale item records.

## Active Inventory Value

Active inventory value is the cost basis sum for items with status `draft`, `active`, `listed`, or `reserved`.

## Fees

Platform fees and payment fees are tracked separately at sale level and allocated to sale items for item-level profit reporting.

## Shipping Profit/Loss

Shipping profit/loss is:

`shipping charged to buyer - actual shipping cost - packaging cost`

## Sales Tax

The app stores sales tax collected and whether a marketplace collected tax. Tax reports are aids for bookkeeping review and are not tax or legal advice.

## Limitations

Reconciliation is manual in the MVP. Event fee allocation is stubbed at zero for sale item allocation until event allocation rules are configured.
