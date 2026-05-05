import { averageOrderValue, saleLevelNetProfit, sellThroughProxy, shippingProfitLoss, staleInventoryBuckets } from "../lib/calculations";
import type { AgingBucket } from "../lib/calculations";
import type { Expense, Item, Payment, Sale, SaleItem } from "../types/domain";

export interface DashboardMetrics {
  grossSalesThisMonthCents: number;
  netProfitThisMonthCents: number;
  activeInventoryValueCents: number;
  activeItemCount: number;
  soldItemsThisMonth: number;
  averageOrderValueCents: number;
  multiItemSaleRate: number;
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

export const dashboardMetrics = (items: Item[], sales: Sale[], saleItemsBySale: Record<string, SaleItem[]>, payments: Payment[], now = new Date()): DashboardMetrics => {
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthSales = sales.filter((sale) => tsDate(sale.soldAt) >= monthStart && tsDate(sale.soldAt) <= now);
  const monthSaleItems = monthSales.flatMap((sale) => saleItemsBySale[sale.id] ?? []);
  const activeItems = items.filter((item) => activeStatuses.includes(item.status));
  const staleBuckets = staleInventoryBuckets(activeItems, now);
  return {
    grossSalesThisMonthCents: monthSales.reduce((sum, sale) => sum + sale.grossItemSubtotalCents, 0),
    netProfitThisMonthCents: monthSales.reduce((sum, sale) => sum + saleLevelNetProfit(sale, saleItemsBySale[sale.id] ?? []), 0),
    activeInventoryValueCents: activeItems.reduce((sum, item) => sum + item.costBasisCents, 0),
    activeItemCount: activeItems.length,
    soldItemsThisMonth: monthSaleItems.length,
    averageOrderValueCents: averageOrderValue(monthSales.reduce((sum, sale) => sum + sale.grossItemSubtotalCents, 0), monthSales.length),
    multiItemSaleRate: monthSales.length ? monthSales.filter((sale) => (saleItemsBySale[sale.id] ?? []).length >= 2).length / monthSales.length : 0,
    shippingProfitLossCents: monthSales.reduce((sum, sale) => sum + shippingProfitLoss(sale.shippingChargedCents, sale.actualShippingCostCents, sale.packagingCostCents), 0),
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
