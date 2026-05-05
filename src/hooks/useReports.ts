import { useItems } from "./useItems";
import { useSales } from "./useSales";
import { useMemo } from "react";
import { dashboardMetrics, profitByField } from "../services/reportService";
import type { Payment } from "../types/domain";

export const useReports = (payments: Payment[] = []) => {
  const itemState = useItems();
  const salesState = useSales();
  const saleItems = useMemo(() => Object.values(salesState.saleItemsBySale).flat(), [salesState.saleItemsBySale]);
  return {
    ...itemState,
    ...salesState,
    saleItems,
    metrics: dashboardMetrics(itemState.items, salesState.sales, salesState.saleItemsBySale, payments),
    profitByBrand: profitByField(itemState.items, saleItems, "brand"),
    profitByMaterial: profitByField(itemState.items, saleItems, "material"),
    profitByItemType: profitByField(itemState.items, saleItems, "itemType")
  };
};
