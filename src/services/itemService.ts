import type { Category, Item, ItemPhoto, ItemStatus } from "../types/domain";
import { apiRequest } from "./apiClient";

export const inventoryPageSizes = [12, 24, 48, 96] as const;
export const inventorySortModes = ["newest", "oldest", "highest_cost", "highest_list_price", "stale_first"] as const;
export type InventorySortMode = (typeof inventorySortModes)[number];

export interface ItemPageRequest {
  page: number;
  pageSize: number;
  search?: string;
  status?: ItemStatus | "";
  category?: Category | "";
  sort: InventorySortMode;
}

export interface ItemPageResponse {
  items: Item[];
  total: number;
  page: number;
  pageSize: number;
}

export type ItemFormInput = Omit<
  Item,
  "id" | "orgId" | "itemCode" | "photos" | "listingUrls" | "styleTags" | "seasonTags" | "reviewFlags" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy"
> & {
  itemCode?: string;
  photos?: ItemPhoto[];
  reviewFlags?: string[];
};

export const listItems = async (orgId: string): Promise<Item[]> => apiRequest<Item[]>(`/api/orgs/${orgId}/items`);

export const listItemsPage = async (orgId: string, request: ItemPageRequest): Promise<ItemPageResponse> => {
  const params = new URLSearchParams({
    page: String(request.page),
    pageSize: String(request.pageSize),
    sort: request.sort
  });
  if (request.search) params.set("search", request.search);
  if (request.status) params.set("status", request.status);
  if (request.category) params.set("category", request.category);
  return apiRequest<ItemPageResponse>(`/api/orgs/${orgId}/items?${params.toString()}`);
};

export const searchItems = async (orgId: string, query: string, limit = 8): Promise<Item[]> => {
  const params = new URLSearchParams({ query, limit: String(limit) });
  return apiRequest<Item[]>(`/api/orgs/${orgId}/items/search?${params.toString()}`);
};

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
