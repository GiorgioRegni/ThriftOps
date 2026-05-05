import type { PaymentSource, SaleChannel } from "../types/domain";
import { apiRequest } from "./apiClient";

export interface ReconciliationPayment {
  id: string;
  source: PaymentSource;
  amountCents: number;
  date: string;
}

export interface ReconciliationSale {
  id: string;
  channel: SaleChannel;
  totalReceivedCents: number;
  soldAt: string;
}

export interface ReconciliationSuggestion {
  payment: string;
  sale: string;
  amountCents: number;
  reason: string;
}

export interface ReconciliationData {
  payments: ReconciliationPayment[];
  sales: ReconciliationSale[];
  suggestions: ReconciliationSuggestion[];
}

export const getReconciliationData = async (orgId: string): Promise<ReconciliationData> => apiRequest<ReconciliationData>(`/api/orgs/${orgId}/reconciliation`);
