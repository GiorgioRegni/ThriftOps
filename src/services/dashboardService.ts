import type { DashboardMetrics } from "./reportService";
import type { Item, SaleChannel } from "../types/domain";
import { apiRequest } from "./apiClient";

export interface DashboardSalePreview {
  id: string;
  soldAt: string;
  channel: SaleChannel;
  grossItemSubtotalCents: number;
  itemCount: number;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  recentSales: DashboardSalePreview[];
  staleItems: Item[];
}

export const getDashboardData = async (orgId: string): Promise<DashboardData> => apiRequest<DashboardData>(`/api/orgs/${orgId}/dashboard`);
