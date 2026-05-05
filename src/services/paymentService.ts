import type { Payment, PaymentSource, PaymentStatus } from "../types/domain";
import { apiRequest } from "./apiClient";

export interface PaymentInput {
  date: string;
  source: PaymentSource;
  amountCents: number;
  externalTransactionId?: string;
  counterparty?: string;
  note?: string;
  matchedSaleIds?: string[];
  status?: PaymentStatus;
  importedFrom?: string;
}

export const listPayments = async (orgId: string): Promise<Payment[]> => apiRequest<Payment[]>(`/api/orgs/${orgId}/payments`);

export const createPayment = async (orgId: string, input: PaymentInput): Promise<string> => {
  const result = await apiRequest<{ id: string }>(`/api/orgs/${orgId}/payments`, { method: "POST", body: JSON.stringify(input) });
  return result.id;
};

export const updatePaymentMatch = async (orgId: string, paymentId: string, saleIds: string[], status: PaymentStatus): Promise<void> => {
  await apiRequest<Payment>(`/api/orgs/${orgId}/payments/${paymentId}/match`, { method: "PATCH", body: JSON.stringify({ saleIds, status }) });
};
