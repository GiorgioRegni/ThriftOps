import { useCallback, useEffect, useState } from "react";
import type { Purchase } from "../types/domain";
import { listPurchases } from "../services/purchaseService";
import { useOrg } from "./useOrg";

export const usePurchases = () => {
  const { org } = useOrg();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    if (!org) return;
    setLoading(true);
    setPurchases(await listPurchases(org.id));
    setLoading(false);
  }, [org]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  return { purchases, loading, refresh };
};
