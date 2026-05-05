import type { Category, Item, ItemPhoto, ItemStatus } from "../types/domain";
import { apiRequest } from "./apiClient";

export type ItemFormInput = Omit<
  Item,
  "id" | "orgId" | "itemCode" | "photos" | "listingUrls" | "styleTags" | "seasonTags" | "reviewFlags" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy"
> & {
  itemCode?: string;
  photos?: ItemPhoto[];
  reviewFlags?: string[];
};

export const listItems = async (orgId: string): Promise<Item[]> => apiRequest<Item[]>(`/api/orgs/${orgId}/items`);

export const getItem = async (orgId: string, itemId: string): Promise<Item | undefined> => apiRequest<Item>(`/api/orgs/${orgId}/items/${itemId}`);

export const createItem = async (orgId: string, _uid: string, input: ItemFormInput): Promise<string> => {
  const result = await apiRequest<{ id: string }>(`/api/orgs/${orgId}/items`, { method: "POST", body: JSON.stringify(input) });
  return result.id;
};

export const updateItem = async (orgId: string, itemId: string, _uid: string, patch: Partial<Item>): Promise<void> => {
  await apiRequest<Item>(`/api/orgs/${orgId}/items/${itemId}`, { method: "PATCH", body: JSON.stringify(patch) });
};

export const deleteItem = async (orgId: string, itemId: string): Promise<void> => apiRequest<void>(`/api/orgs/${orgId}/items/${itemId}`, { method: "DELETE" });

export const updateItemStatus = async (orgId: string, itemId: string, uid: string, status: ItemStatus): Promise<void> =>
  updateItem(orgId, itemId, uid, { status, ...(status === "listed" ? { listedAt: new Date().toISOString() } : {}) });

export const addItemPhotos = async (orgId: string, itemId: string, _uid: string, photos: ItemPhoto[]): Promise<void> => {
  await apiRequest<Item>(`/api/orgs/${orgId}/items/${itemId}/photos`, { method: "POST", body: JSON.stringify({ photos }) });
};
