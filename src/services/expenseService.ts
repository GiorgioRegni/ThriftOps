import type { Expense, ExpenseCategory, ItemPhoto } from "../types/domain";
import { apiRequest } from "./apiClient";

export interface ExpenseInput {
  date: string;
  category: ExpenseCategory;
  vendor: string;
  amountCents: number;
  paymentMethod: string;
  linkedItemId?: string;
  linkedSaleId?: string;
  linkedPurchaseId?: string;
  receiptPhotos?: ItemPhoto[];
  taxDeductible: boolean;
  notes: string;
}

export const listExpenses = async (orgId: string): Promise<Expense[]> => apiRequest<Expense[]>(`/api/orgs/${orgId}/expenses`);

export const createExpense = async (orgId: string, _uid: string, input: ExpenseInput): Promise<string> => {
  const result = await apiRequest<{ id: string }>(`/api/orgs/${orgId}/expenses`, { method: "POST", body: JSON.stringify(input) });
  return result.id;
};
