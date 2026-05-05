import type { Org } from "../types/domain";
import { apiRequest } from "./apiClient";

export interface CreateOrgInput {
  name: string;
  homeState: string;
  trackSalesTax: boolean;
  defaultSalesTaxRateBps?: number;
}

export const findOrgsForUser = async (_uid: string): Promise<Org[]> => apiRequest<Org[]>("/api/orgs");

export const createOrg = async (_uid: string, _email: string, _displayName: string, input: CreateOrgInput): Promise<string> => {
  const result = await apiRequest<{ id: string }>("/api/orgs", { method: "POST", body: JSON.stringify(input) });
  return result.id;
};

export const updateOrgSettings = async (orgId: string, input: Partial<CreateOrgInput> & { name?: string }): Promise<void> => {
  await apiRequest<Org>(`/api/orgs/${orgId}`, { method: "PATCH", body: JSON.stringify(input) });
};
