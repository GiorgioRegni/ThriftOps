import type { AllocationMode, ItemPhoto, Purchase } from "../types/domain";
import { apiRequest } from "./apiClient";

export interface PurchaseInput {
  date: string;
  vendor: string;
  location: string;
  totalCents: number;
  subtotalCents?: number;
  taxCents?: number;
  paymentAccount: string;
  paymentMethod: string;
  receiptPhotos?: ItemPhoto[];
  itemIds: string[];
  allocationMode: AllocationMode;
  notes: string;
}

export const listPurchases = async (orgId: string): Promise<Purchase[]> => apiRequest<Purchase[]>(`/api/orgs/${orgId}/purchases`);

export const createPurchase = async (orgId: string, _uid: string, input: PurchaseInput): Promise<string> => {
  const result = await apiRequest<{ id: string }>(`/api/orgs/${orgId}/purchases`, { method: "POST", body: JSON.stringify(input) });
  return result.id;
};
