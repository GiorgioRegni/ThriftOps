import { describe, expect, it } from "vitest";
import { activeInventoryValue, agingBucketForDays, cogsForDateRange, netProfitForSaleItem, shippingProfitLoss, staleInventoryBuckets } from "../lib/calculations";
import { centsFromDecimal, formatMoney } from "../lib/money";

describe("money", () => {
  it("parses and formats integer cents", () => {
    expect(centsFromDecimal("$12.34")).toBe(1234);
    expect(centsFromDecimal("-1.05")).toBe(-105);
    expect(formatMoney(1234)).toBe("$12.34");
  });
});

describe("profit calculations", () => {
  it("calculates net profit for a sale item", () => {
    expect(netProfitForSaleItem({
      allocatedSalePriceCents: 5000,
      allocatedDiscountCents: 500,
      costBasisCents: 1200,
      allocatedPlatformFeeCents: 400,
      allocatedPaymentFeeCents: 150,
      allocatedShippingCostCents: 700,
      allocatedPackagingCostCents: 100,
      allocatedEventFeeCents: 200
    })).toBe(1750);
  });

  it("calculates shipping profit/loss", () => {
    expect(shippingProfitLoss(900, 725, 100)).toBe(75);
  });

  it("calculates COGS for sold items in range", () => {
    const jan = "2026-01-15T00:00:00Z";
    const feb = "2026-02-15T00:00:00Z";
    expect(cogsForDateRange([
      { status: "sold", costBasisCents: 1000, soldAt: jan },
      { status: "sold", costBasisCents: 2000, soldAt: feb },
      { status: "active", costBasisCents: 500, soldAt: undefined }
    ], new Date("2026-01-01T00:00:00Z"), new Date("2026-01-31T23:59:59Z"))).toBe(1000);
  });

  it("calculates active inventory value", () => {
    expect(activeInventoryValue([{ status: "active", costBasisCents: 100 }, { status: "sold", costBasisCents: 1000 }, { status: "reserved", costBasisCents: 250 }])).toBe(350);
  });
});

describe("aging buckets", () => {
  it("assigns days to buckets", () => {
    expect(agingBucketForDays(30)).toBe("0-30");
    expect(agingBucketForDays(61)).toBe("61-90");
    expect(agingBucketForDays(181)).toBe("180+");
  });

  it("builds stale inventory buckets", () => {
    const asOf = new Date("2026-05-01T00:00:00Z");
    const buckets = staleInventoryBuckets([{ status: "active", costBasisCents: 1000, acquiredAt: "2026-01-01T00:00:00Z" }], asOf);
    expect(buckets["91-180"]).toEqual({ count: 1, costBasisCents: 1000 });
  });
});
