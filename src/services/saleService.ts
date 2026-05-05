import type { Item, PaymentMethod, PayoutStatus, Sale, SaleChannel, SaleItem } from "../types/domain";
import { apiRequest } from "./apiClient";

export interface SaleCartItem {
  item: Item;
  salePriceCents: number;
}

export interface CreateSaleInput {
  soldAt: string;
  channel: SaleChannel;
  eventId?: string;
  buyerName?: string;
  buyerContact?: string;
  paymentMethod: PaymentMethod;
  discountCents: number;
  shippingChargedCents: number;
  salesTaxCollectedCents: number;
  marketplaceCollectedTax: boolean;
  platformFeeCents: number;
  paymentFeeCents: number;
  actualShippingCostCents: number;
  packagingCostCents: number;
  otherCostCents: number;
  payoutStatus: PayoutStatus;
  notes: string;
  items: SaleCartItem[];
}

export const listSales = async (orgId: string): Promise<Sale[]> => apiRequest<Sale[]>(`/api/orgs/${orgId}/sales`);

export const listSaleItems = async (orgId: string, saleId: string): Promise<SaleItem[]> => apiRequest<SaleItem[]>(`/api/orgs/${orgId}/sales/${saleId}/items`);

export const createSale = async (orgId: string, _uid: string, input: CreateSaleInput): Promise<{ saleId: string; netProfitCents: number }> =>
  apiRequest<{ saleId: string; netProfitCents: number }>(`/api/orgs/${orgId}/sales`, { method: "POST", body: JSON.stringify(input) });

export const linkPaymentToSales = async (orgId: string, saleIds: string[], paymentId: string): Promise<void> => {
  await apiRequest<void>(`/api/orgs/${orgId}/sales/payment-match`, { method: "PATCH", body: JSON.stringify({ saleIds, paymentId, status: "matched" }) });
};
