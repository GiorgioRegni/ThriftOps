import type { Event } from "../types/domain";
import { apiRequest } from "./apiClient";

export interface EventInput {
  name: string;
  date: string;
  location: string;
  boothFeeCents: number;
  notes: string;
  itemIdsBrought?: string[];
}

export const listEvents = async (orgId: string): Promise<Event[]> => apiRequest<Event[]>(`/api/orgs/${orgId}/events`);

export const createEvent = async (orgId: string, _uid: string, input: EventInput): Promise<string> => {
  const result = await apiRequest<{ id: string }>(`/api/orgs/${orgId}/events`, { method: "POST", body: JSON.stringify(input) });
  return result.id;
};
