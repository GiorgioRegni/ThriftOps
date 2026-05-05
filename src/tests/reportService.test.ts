import { describe, expect, it } from "vitest";
import { dashboardMetrics } from "../services/reportService";
import type { Sale, SaleItem } from "../types/domain";

const sale = (overrides: Partial<Sale>): Sale => ({
  id: "sale-1",
  orgId: "org-1",
  soldAt: "2026-04-19T07:00:00.000Z",
  channel: "in_person_market",
  paymentMethod: "other",
  grossItemSubtotalCents: 10000,
  discountCents: 0,
  shippingChargedCents: 500,
  salesTaxCollectedCents: 0,
  marketplaceCollectedTax: false,
  platformFeeCents: 0,
  paymentFeeCents: 0,
  actualShippingCostCents: 300,
  packagingCostCents: 100,
  otherCostCents: 0,
  totalReceivedCents: 10500,
  payoutStatus: "unmatched",
  paymentIds: [],
  notes: "",
  proofPhotos: [],
  createdAt: "2026-04-19T07:00:00.000Z",
  updatedAt: "2026-04-19T07:00:00.000Z",
  createdBy: "uid",
  updatedBy: "uid",
  ...overrides
});

const saleItem = (overrides: Partial<SaleItem>): SaleItem => ({
  id: "sale-item-1",
  saleId: "sale-1",
  itemId: "item-1",
  itemCode: "W-2026-000001",
  titleSnapshot: "Imported item",
  brandSnapshot: "Brand",
  itemTypeSnapshot: "Top",
  categorySnapshot: "women",
  costBasisCents: 2500,
  allocatedSalePriceCents: 5000,
  allocatedDiscountCents: 0,
  allocatedPlatformFeeCents: 0,
  allocatedPaymentFeeCents: 0,
  allocatedShippingCostCents: 0,
  allocatedPackagingCostCents: 0,
  allocatedEventFeeCents: 0,
  netProfitCents: 2500,
  daysHeld: 20,
  createdAt: "2026-04-19T07:00:00.000Z",
  updatedAt: "2026-04-19T07:00:00.000Z",
  ...overrides
});

const activeItems = (costBasisCents: number) => [{ status: "active", costBasisCents, acquiredAt: "2026-01-01T00:00:00.000Z" }] as any;

describe("dashboard metrics", () => {
  it("keeps last-month imported sales in all-time and last-month metrics while current month stays zero", () => {
    const metrics = dashboardMetrics(
      activeItems(5000),
      [sale({})],
      { "sale-1": [saleItem({}), saleItem({ id: "sale-item-2", itemId: "item-2", costBasisCents: 1500 })] },
      [],
      new Date("2026-05-05T12:00:00.000Z")
    );

    expect(metrics.grossSalesAllTimeCents).toBe(10000);
    expect(metrics.netProfitAllTimeCents).toBe(6100);
    expect(metrics.soldItemsAllTime).toBe(2);
    expect(metrics.cogsAllTimeCents).toBe(4000);
    expect(metrics.averageOrderValueAllTimeCents).toBe(10000);
    expect(metrics.grossReturnMultipleAllTime).toBe(2.5);
    expect(metrics.grossMarginRateAllTime).toBe(0.6);
    expect(metrics.inventoryRevenuePotentialCents).toBe(12500);
    expect(metrics.multiItemSaleRateAllTime).toBe(1);
    expect(metrics.shippingProfitLossAllTimeCents).toBe(100);
    expect(metrics.grossSalesLastMonthCents).toBe(10000);
    expect(metrics.netProfitLastMonthCents).toBe(6100);
    expect(metrics.soldItemsLastMonth).toBe(2);
    expect(metrics.cogsLastMonthCents).toBe(4000);
    expect(metrics.averageOrderValueLastMonthCents).toBe(10000);
    expect(metrics.grossReturnMultipleLastMonth).toBe(2.5);
    expect(metrics.grossMarginRateLastMonth).toBe(0.6);
    expect(metrics.multiItemSaleRateLastMonth).toBe(1);
    expect(metrics.shippingProfitLossLastMonthCents).toBe(100);
    expect(metrics.grossSalesThisMonthCents).toBe(0);
    expect(metrics.netProfitThisMonthCents).toBe(0);
    expect(metrics.soldItemsThisMonth).toBe(0);
    expect(metrics.cogsThisMonthCents).toBe(0);
    expect(metrics.averageOrderValueThisMonthCents).toBe(0);
    expect(metrics.grossReturnMultipleThisMonth).toBe(0);
    expect(metrics.grossMarginRateThisMonth).toBe(0);
    expect(metrics.multiItemSaleRateThisMonth).toBe(0);
    expect(metrics.shippingProfitLossThisMonthCents).toBe(0);
  });

  it("returns zero all-time and current-month sales metrics when no sales exist", () => {
    const metrics = dashboardMetrics(activeItems(5000), [], {}, [], new Date("2026-05-05T12:00:00.000Z"));

    expect(metrics.grossSalesAllTimeCents).toBe(0);
    expect(metrics.netProfitAllTimeCents).toBe(0);
    expect(metrics.soldItemsAllTime).toBe(0);
    expect(metrics.activeInventoryValueCents).toBe(5000);
    expect(metrics.inventoryRevenuePotentialCents).toBe(0);
    expect(metrics.cogsAllTimeCents).toBe(0);
    expect(metrics.grossReturnMultipleAllTime).toBe(0);
    expect(metrics.grossMarginRateAllTime).toBe(0);
    expect(metrics.grossSalesLastMonthCents).toBe(0);
    expect(metrics.netProfitLastMonthCents).toBe(0);
    expect(metrics.soldItemsLastMonth).toBe(0);
    expect(metrics.cogsLastMonthCents).toBe(0);
    expect(metrics.grossReturnMultipleLastMonth).toBe(0);
    expect(metrics.grossMarginRateLastMonth).toBe(0);
    expect(metrics.grossSalesThisMonthCents).toBe(0);
    expect(metrics.netProfitThisMonthCents).toBe(0);
    expect(metrics.soldItemsThisMonth).toBe(0);
    expect(metrics.cogsThisMonthCents).toBe(0);
    expect(metrics.grossReturnMultipleThisMonth).toBe(0);
    expect(metrics.grossMarginRateThisMonth).toBe(0);
  });
});
