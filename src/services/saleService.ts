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

export interface SaleSummaryRow {
  id: string;
  soldAt: string;
  channel: SaleChannel;
  grossItemSubtotalCents: number;
  netProfitCents: number;
  itemCount: number;
  payoutStatus: PayoutStatus;
}

export interface SaleSummaryResponse {
  rows: SaleSummaryRow[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SaleDetailResponse {
  sale: Sale;
  items: SaleItem[];
}

export const listSales = async (orgId: string): Promise<Sale[]> => apiRequest<Sale[]>(`/api/orgs/${orgId}/sales`);

export const listSaleItems = async (orgId: string, saleId: string): Promise<SaleItem[]> => apiRequest<SaleItem[]>(`/api/orgs/${orgId}/sales/${saleId}/items`);

export const listSaleItemsBulk = async (orgId: string, saleIds: string[]): Promise<SaleItem[]> => {
  if (!saleIds.length) return [];
  const params = new URLSearchParams({ saleIds: saleIds.join(",") });
  return apiRequest<SaleItem[]>(`/api/orgs/${orgId}/sale-items?${params.toString()}`);
};

export const listSalesSummary = async (orgId: string, input: { page: number; pageSize: number; channel?: string; multiOnly?: boolean }): Promise<SaleSummaryResponse> => {
  const params = new URLSearchParams({ page: String(input.page), pageSize: String(input.pageSize), multiOnly: String(Boolean(input.multiOnly)) });
  if (input.channel) params.set("channel", input.channel);
  return apiRequest<SaleSummaryResponse>(`/api/orgs/${orgId}/sales/summary?${params.toString()}`);
};

export const getSaleDetail = async (orgId: string, saleId: string): Promise<SaleDetailResponse> => apiRequest<SaleDetailResponse>(`/api/orgs/${orgId}/sales/${saleId}`);

export const createSale = async (orgId: string, _uid: string, input: CreateSaleInput): Promise<{ saleId: string; netProfitCents: number }> =>
  apiRequest<{ saleId: string; netProfitCents: number }>(`/api/orgs/${orgId}/sales`, { method: "POST", body: JSON.stringify(input) });

export const linkPaymentToSales = async (orgId: string, saleIds: string[], paymentId: string): Promise<void> => {
  await apiRequest<void>(`/api/orgs/${orgId}/sales/payment-match`, { method: "PATCH", body: JSON.stringify({ saleIds, paymentId, status: "matched" }) });
};
