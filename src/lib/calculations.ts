import { differenceInCalendarDays } from "date-fns";
import type { Item, ItemStatus, Sale, SaleItem } from "../types/domain";

export interface SaleItemProfitInput {
  allocatedSalePriceCents: number;
  allocatedDiscountCents: number;
  costBasisCents: number;
  allocatedPlatformFeeCents: number;
  allocatedPaymentFeeCents: number;
  allocatedShippingCostCents: number;
  allocatedPackagingCostCents: number;
  allocatedEventFeeCents: number;
}

export const netProfitForSaleItem = (input: SaleItemProfitInput): number =>
  input.allocatedSalePriceCents -
  input.allocatedDiscountCents -
  input.costBasisCents -
  input.allocatedPlatformFeeCents -
  input.allocatedPaymentFeeCents -
  input.allocatedShippingCostCents -
  input.allocatedPackagingCostCents -
  input.allocatedEventFeeCents;

type SaleLevelNetProfitInput = Pick<
  Sale,
  | "grossItemSubtotalCents"
  | "discountCents"
  | "shippingChargedCents"
  | "platformFeeCents"
  | "paymentFeeCents"
  | "actualShippingCostCents"
  | "packagingCostCents"
  | "otherCostCents"
>;

export const saleLevelNetProfit = (sale: SaleLevelNetProfitInput, saleItems: Pick<SaleItem, "costBasisCents">[], allocatedEventFeeCents = 0): number =>
  sale.grossItemSubtotalCents -
  sale.discountCents +
  sale.shippingChargedCents -
  sale.platformFeeCents -
  sale.paymentFeeCents -
  sale.actualShippingCostCents -
  sale.packagingCostCents -
  sale.otherCostCents -
  saleItems.reduce((sum, item) => sum + item.costBasisCents, 0) -
  allocatedEventFeeCents;

const activeStatuses: ItemStatus[] = ["draft", "active", "listed", "reserved"];

export const activeInventoryValue = (items: Pick<Item, "status" | "costBasisCents">[]): number =>
  items.filter((item) => activeStatuses.includes(item.status)).reduce((sum, item) => sum + item.costBasisCents, 0);

export const cogsForDateRange = (items: Pick<Item, "status" | "costBasisCents" | "soldAt">[], start: Date, end: Date): number =>
  items
    .filter((item) => item.status === "sold" && item.soldAt)
    .filter((item) => {
      const soldAt = new Date(item.soldAt!);
      return soldAt >= start && soldAt <= end;
    })
    .reduce((sum, item) => sum + item.costBasisCents, 0);

export const daysHeld = (soldAt?: string, acquiredAt?: string): number =>
  soldAt && acquiredAt ? Math.max(0, differenceInCalendarDays(new Date(soldAt), new Date(acquiredAt))) : 0;

export const daysListed = (soldAt?: string, listedAt?: string): number | undefined =>
  soldAt && listedAt ? Math.max(0, differenceInCalendarDays(new Date(soldAt), new Date(listedAt))) : undefined;

export const isMultiItemSale = (saleItems: unknown[]): boolean => saleItems.length >= 2;
export const averageOrderValue = (grossRevenueCents: number, numberOfSales: number): number => (numberOfSales ? Math.round(grossRevenueCents / numberOfSales) : 0);
export const averageItemSalePrice = (grossItemSubtotalCents: number, soldItemCount: number): number => (soldItemCount ? Math.round(grossItemSubtotalCents / soldItemCount) : 0);
export const grossReturnMultiple = (grossItemSubtotalCents: number, cogsCents: number): number =>
  cogsCents ? grossItemSubtotalCents / cogsCents : 0;
export const grossMarginRate = (grossItemSubtotalCents: number, cogsCents: number): number =>
  grossItemSubtotalCents ? (grossItemSubtotalCents - cogsCents) / grossItemSubtotalCents : 0;
export const inventoryRevenuePotential = (activeInventoryValueCents: number, grossReturnMultipleValue: number): number =>
  Math.round(activeInventoryValueCents * grossReturnMultipleValue);
export const shippingProfitLoss = (shippingChargedCents: number, actualShippingCostCents: number, packagingCostCents: number): number =>
  shippingChargedCents - actualShippingCostCents - packagingCostCents;

export const sellThroughProxy = (soldCount: number, availableCount: number): number => {
  const denominator = soldCount + availableCount;
  return denominator ? soldCount / denominator : 0;
};

export type AgingBucket = "0-30" | "31-60" | "61-90" | "91-180" | "180+";

export const agingBucketForDays = (ageDays: number): AgingBucket => {
  if (ageDays <= 30) return "0-30";
  if (ageDays <= 60) return "31-60";
  if (ageDays <= 90) return "61-90";
  if (ageDays <= 180) return "91-180";
  return "180+";
};

export const staleInventoryBuckets = (items: Pick<Item, "status" | "costBasisCents" | "acquiredAt">[], asOf = new Date()): Record<AgingBucket, { count: number; costBasisCents: number }> => {
  const buckets: Record<AgingBucket, { count: number; costBasisCents: number }> = {
    "0-30": { count: 0, costBasisCents: 0 },
    "31-60": { count: 0, costBasisCents: 0 },
    "61-90": { count: 0, costBasisCents: 0 },
    "91-180": { count: 0, costBasisCents: 0 },
    "180+": { count: 0, costBasisCents: 0 }
  };
  items.filter((item) => activeStatuses.includes(item.status)).forEach((item) => {
    const bucket = agingBucketForDays(Math.max(0, differenceInCalendarDays(asOf, new Date(item.acquiredAt))));
    buckets[bucket].count += 1;
    buckets[bucket].costBasisCents += item.costBasisCents;
  });
  return buckets;
};
