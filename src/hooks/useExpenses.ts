import { useCallback, useEffect, useState } from "react";
import type { Expense } from "../types/domain";
import { listExpenses } from "../services/expenseService";
import { useOrg } from "./useOrg";

export const useExpenses = () => {
  const { org } = useOrg();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    if (!org) return;
    setLoading(true);
    setExpenses(await listExpenses(org.id));
    setLoading(false);
  }, [org]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  return { expenses, loading, refresh };
};
