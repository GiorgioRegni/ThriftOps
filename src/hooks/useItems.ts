import { useCallback, useEffect, useState } from "react";
import type { Item } from "../types/domain";
import { listItems } from "../services/itemService";
import { useOrg } from "./useOrg";

export const useItems = () => {
  const { org } = useOrg();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    if (!org) return;
    setLoading(true);
    setError("");
    try {
      setItems(await listItems(org.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load inventory.");
    } finally {
      setLoading(false);
    }
  }, [org]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  return { items, loading, error, refresh };
};
