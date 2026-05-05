import { useCallback, useEffect, useState } from "react";
import type { Sale, SaleItem } from "../types/domain";
import { listSaleItemsBulk, listSales } from "../services/saleService";
import { useOrg } from "./useOrg";

export const useSales = () => {
  const { org } = useOrg();
  const [sales, setSales] = useState<Sale[]>([]);
  const [saleItemsBySale, setSaleItemsBySale] = useState<Record<string, SaleItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    if (!org) return;
    setLoading(true);
    setError("");
    try {
      const nextSales = await listSales(org.id);
      const saleItems = await listSaleItemsBulk(org.id, nextSales.map((sale) => sale.id));
      const grouped = saleItems.reduce<Record<string, SaleItem[]>>((acc, saleItem) => {
        acc[saleItem.saleId] = [...(acc[saleItem.saleId] ?? []), saleItem];
        return acc;
      }, {});
      const entries = nextSales.map((sale) => [sale.id, grouped[sale.id] ?? []] as const);
      setSales(nextSales);
      setSaleItemsBySale(Object.fromEntries(entries));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load sales.");
    } finally {
      setLoading(false);
    }
  }, [org]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  return { sales, saleItemsBySale, loading, error, refresh };
};
