import { useCallback, useEffect, useRef, useState } from "react";
import type { Category, Item, ItemStatus } from "../types/domain";
import { listItemsPage, type InventorySortMode } from "../services/itemService";
import { useOrg } from "./useOrg";

export interface InventoryItemsQuery {
  page: number;
  pageSize: number;
  search: string;
  status: ItemStatus | "";
  category: Category | "";
  sort: InventorySortMode;
}

export const useInventoryItems = (query: InventoryItemsQuery) => {
  const { org } = useOrg();
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestId = useRef(0);

  const refresh = useCallback(async () => {
    const currentRequestId = requestId.current + 1;
    requestId.current = currentRequestId;
    if (!org) {
      setItems([]);
      setTotal(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    setItems([]);
    setTotal(0);
    try {
      const result = await listItemsPage(org.id, query);
      if (requestId.current !== currentRequestId) return;
      setItems(result.items);
      setTotal(result.total);
    } catch (err) {
      if (requestId.current !== currentRequestId) return;
      setItems([]);
      setTotal(0);
      setError(err instanceof Error ? err.message : "Unable to load inventory.");
    } finally {
      if (requestId.current === currentRequestId) setLoading(false);
    }
  }, [org, query]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { items, total, loading, error, refresh };
};
