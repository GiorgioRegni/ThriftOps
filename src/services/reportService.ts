import { averageOrderValue, grossMarginRate, grossReturnMultiple, inventoryRevenuePotential, saleLevelNetProfit, sellThroughProxy, shippingProfitLoss, staleInventoryBuckets } from "../lib/calculations";
import type { AgingBucket } from "../lib/calculations";
import type { Expense, Item, Payment, Sale, SaleItem } from "../types/domain";

export interface DashboardMetrics {
  grossSalesAllTimeCents: number;
  netProfitAllTimeCents: number;
  grossSalesThisMonthCents: number;
  netProfitThisMonthCents: number;
  grossSalesLastMonthCents: number;
  netProfitLastMonthCents: number;
  activeInventoryValueCents: number;
  activeItemCount: number;
  inventoryRevenuePotentialCents: number;
  soldItemsAllTime: number;
  soldItemsThisMonth: number;
  soldItemsLastMonth: number;
  cogsAllTimeCents: number;
  cogsThisMonthCents: number;
  cogsLastMonthCents: number;
  averageOrderValueAllTimeCents: number;
  averageOrderValueThisMonthCents: number;
  averageOrderValueLastMonthCents: number;
  averageOrderValueCents: number;
  grossReturnMultipleAllTime: number;
  grossReturnMultipleThisMonth: number;
  grossReturnMultipleLastMonth: number;
  grossMarginRateAllTime: number;
  grossMarginRateThisMonth: number;
  grossMarginRateLastMonth: number;
  multiItemSaleRateAllTime: number;
  multiItemSaleRateThisMonth: number;
  multiItemSaleRateLastMonth: number;
  multiItemSaleRate: number;
  shippingProfitLossAllTimeCents: number;
  shippingProfitLossThisMonthCents: number;
  shippingProfitLossLastMonthCents: number;
  shippingProfitLossCents: number;
  staleInventoryCount90Plus: number;
  unmatchedPaymentCount: number;
}

export interface GroupProfitRow {
  group: string;
  activeCount: number;
  soldCount: number;
  grossSalesCents: number;
  cogsCents: number;
  netProfitCents: number;
  averageProfitPerSoldItemCents: number;
  sellThroughProxy: number;
  medianDaysHeld: number;
}

const tsDate = (value: string): Date => new Date(value);
const activeStatuses = ["draft", "active", "listed", "reserved"];

const salesMetricSummary = (sales: Sale[], saleItemsBySale: Record<string, SaleItem[]>) => {
  const grossSalesCents = sales.reduce((sum, sale) => sum + sale.grossItemSubtotalCents, 0);
  const cogsCents = sales.reduce((sum, sale) => sum + (saleItemsBySale[sale.id] ?? []).reduce((itemSum, saleItem) => itemSum + saleItem.costBasisCents, 0), 0);
  return {
    grossSalesCents,
    cogsCents,
    netProfitCents: sales.reduce((sum, sale) => sum + saleLevelNetProfit(sale, saleItemsBySale[sale.id] ?? []), 0),
    soldItems: sales.reduce((sum, sale) => sum + (saleItemsBySale[sale.id] ?? []).length, 0),
    averageOrderValueCents: averageOrderValue(grossSalesCents, sales.length),
    grossReturnMultiple: grossReturnMultiple(grossSalesCents, cogsCents),
    grossMarginRate: grossMarginRate(grossSalesCents, cogsCents),
    multiItemSaleRate: sales.length ? sales.filter((sale) => (saleItemsBySale[sale.id] ?? []).length >= 2).length / sales.length : 0,
    shippingProfitLossCents: sales.reduce((sum, sale) => sum + shippingProfitLoss(sale.shippingChargedCents, sale.actualShippingCostCents, sale.packagingCostCents), 0)
  };
};

export const dashboardMetrics = (items: Item[], sales: Sale[], saleItemsBySale: Record<string, SaleItem[]>, payments: Payment[], now = new Date()): DashboardMetrics => {
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const monthSales = sales.filter((sale) => tsDate(sale.soldAt) >= monthStart && tsDate(sale.soldAt) <= now);
  const lastMonthSales = sales.filter((sale) => tsDate(sale.soldAt) >= lastMonthStart && tsDate(sale.soldAt) < monthStart);
  const allTimeMetrics = salesMetricSummary(sales, saleItemsBySale);
  const monthMetrics = salesMetricSummary(monthSales, saleItemsBySale);
  const lastMonthMetrics = salesMetricSummary(lastMonthSales, saleItemsBySale);
  const activeItems = items.filter((item) => activeStatuses.includes(item.status));
  const activeInventoryValueCents = activeItems.reduce((sum, item) => sum + item.costBasisCents, 0);
  const staleBuckets = staleInventoryBuckets(activeItems, now);
  return {
    grossSalesAllTimeCents: allTimeMetrics.grossSalesCents,
    netProfitAllTimeCents: allTimeMetrics.netProfitCents,
    grossSalesThisMonthCents: monthMetrics.grossSalesCents,
    netProfitThisMonthCents: monthMetrics.netProfitCents,
    grossSalesLastMonthCents: lastMonthMetrics.grossSalesCents,
    netProfitLastMonthCents: lastMonthMetrics.netProfitCents,
    activeInventoryValueCents,
    activeItemCount: activeItems.length,
    inventoryRevenuePotentialCents: inventoryRevenuePotential(activeInventoryValueCents, allTimeMetrics.grossReturnMultiple),
    soldItemsAllTime: allTimeMetrics.soldItems,
    soldItemsThisMonth: monthMetrics.soldItems,
    soldItemsLastMonth: lastMonthMetrics.soldItems,
    cogsAllTimeCents: allTimeMetrics.cogsCents,
    cogsThisMonthCents: monthMetrics.cogsCents,
    cogsLastMonthCents: lastMonthMetrics.cogsCents,
    averageOrderValueAllTimeCents: allTimeMetrics.averageOrderValueCents,
    averageOrderValueThisMonthCents: monthMetrics.averageOrderValueCents,
    averageOrderValueLastMonthCents: lastMonthMetrics.averageOrderValueCents,
    averageOrderValueCents: allTimeMetrics.averageOrderValueCents,
    grossReturnMultipleAllTime: allTimeMetrics.grossReturnMultiple,
    grossReturnMultipleThisMonth: monthMetrics.grossReturnMultiple,
    grossReturnMultipleLastMonth: lastMonthMetrics.grossReturnMultiple,
    grossMarginRateAllTime: allTimeMetrics.grossMarginRate,
    grossMarginRateThisMonth: monthMetrics.grossMarginRate,
    grossMarginRateLastMonth: lastMonthMetrics.grossMarginRate,
    multiItemSaleRateAllTime: allTimeMetrics.multiItemSaleRate,
    multiItemSaleRateThisMonth: monthMetrics.multiItemSaleRate,
    multiItemSaleRateLastMonth: lastMonthMetrics.multiItemSaleRate,
    multiItemSaleRate: allTimeMetrics.multiItemSaleRate,
    shippingProfitLossAllTimeCents: allTimeMetrics.shippingProfitLossCents,
    shippingProfitLossThisMonthCents: monthMetrics.shippingProfitLossCents,
    shippingProfitLossLastMonthCents: lastMonthMetrics.shippingProfitLossCents,
    shippingProfitLossCents: allTimeMetrics.shippingProfitLossCents,
    staleInventoryCount90Plus: staleBuckets["91-180"].count + staleBuckets["180+"].count,
    unmatchedPaymentCount: payments.filter((payment) => payment.status !== "matched").length
  };
};

const median = (values: number[]): number => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
};

export const profitByField = (items: Item[], saleItems: SaleItem[], field: "brand" | "material" | "itemType" | "category"): GroupProfitRow[] => {
  const groups = new Map<string, GroupProfitRow & { daysHeldValues: number[] }>();
  const itemById = new Map(items.map((item) => [item.id, item]));
  const ensure = (group: string) => {
    if (!groups.has(group)) {
      groups.set(group, { group, activeCount: 0, soldCount: 0, grossSalesCents: 0, cogsCents: 0, netProfitCents: 0, averageProfitPerSoldItemCents: 0, sellThroughProxy: 0, medianDaysHeld: 0, daysHeldValues: [] });
    }
    return groups.get(group)!;
  };
  items.forEach((item) => {
    const row = ensure(String(item[field] || "Unknown"));
    if (activeStatuses.includes(item.status)) row.activeCount += 1;
  });
  saleItems.forEach((saleItem) => {
    const item = itemById.get(saleItem.itemId);
    const group = item ? String(item[field] || "Unknown") : String(saleItem[`${field}Snapshot` as keyof SaleItem] || "Unknown");
    const row = ensure(group);
    row.soldCount += 1;
    row.grossSalesCents += saleItem.allocatedSalePriceCents;
    row.cogsCents += saleItem.costBasisCents;
    row.netProfitCents += saleItem.netProfitCents;
    row.daysHeldValues.push(saleItem.daysHeld);
  });
  return [...groups.values()].map(({ daysHeldValues, ...row }) => ({
    ...row,
    averageProfitPerSoldItemCents: row.soldCount ? Math.round(row.netProfitCents / row.soldCount) : 0,
    sellThroughProxy: sellThroughProxy(row.soldCount, row.activeCount),
    medianDaysHeld: median(daysHeldValues)
  }));
};

export const agingRows = (items: Item[]): Array<{ bucket: AgingBucket; itemCount: number; totalCostBasisCents: number; suggestedAction: string }> => {
  const buckets = staleInventoryBuckets(items);
  return Object.entries(buckets).map(([bucket, value]) => ({
    bucket: bucket as AgingBucket,
    itemCount: value.count,
    totalCostBasisCents: value.costBasisCents,
    suggestedAction: bucket === "180+" ? "Markdown, bundle, donate, or relist." : bucket === "91-180" ? "Refresh photos and reduce price." : "Monitor."
  }));
};

export const expensesTotal = (expenses: Expense[]): number => expenses.reduce((sum, expense) => sum + expense.amountCents, 0);
