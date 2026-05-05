import { Prisma } from "@prisma/client";

export const itemPageSizes = [12, 24, 48, 96] as const;
export const defaultItemPageSize = 24;
export const itemSortModes = ["newest", "oldest", "highest_cost", "highest_list_price", "stale_first"] as const;

const itemStatuses = ["draft", "active", "listed", "reserved", "sold", "donated", "lost", "returned"] as const;
const itemCategories = ["women", "kids", "home_goods", "uncategorized"] as const;

export type ItemSortMode = (typeof itemSortModes)[number];

export interface ItemPageQuery {
  page: number;
  pageSize: number;
  search: string;
  status: string;
  category: string;
  sort: ItemSortMode;
}

const firstQueryValue = (value: unknown): string => {
  if (Array.isArray(value)) return firstQueryValue(value[0]);
  return typeof value === "string" ? value.trim() : "";
};

const positiveInteger = (value: string, fallback: number): number => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const hasItemPageQuery = (query: Record<string, unknown>): boolean =>
  ["page", "pageSize", "search", "status", "category", "sort"].some((key) => key in query);

export const parseItemPageQuery = (query: Record<string, unknown>): ItemPageQuery => {
  const requestedPageSize = positiveInteger(firstQueryValue(query.pageSize), defaultItemPageSize);
  const sort = firstQueryValue(query.sort);
  const status = firstQueryValue(query.status);
  const category = firstQueryValue(query.category);

  return {
    page: positiveInteger(firstQueryValue(query.page), 1),
    pageSize: itemPageSizes.includes(requestedPageSize as (typeof itemPageSizes)[number]) ? requestedPageSize : defaultItemPageSize,
    search: firstQueryValue(query.search),
    status: itemStatuses.includes(status as (typeof itemStatuses)[number]) ? status : "",
    category: itemCategories.includes(category as (typeof itemCategories)[number]) ? category : "",
    sort: itemSortModes.includes(sort as ItemSortMode) ? sort as ItemSortMode : "newest"
  };
};

export const itemWhereFromPageQuery = (orgId: string, query: ItemPageQuery): Prisma.ItemWhereInput => ({
  orgId,
  ...(query.status ? { status: query.status } : {}),
  ...(query.category ? { category: query.category } : {}),
  ...(query.search ? {
    OR: ["itemCode", "brand", "title", "itemType", "size", "material", "sourceVendor"].map((field) => ({
      [field]: { contains: query.search, mode: "insensitive" as const }
    }))
  } : {})
});

export const itemOrderByFromSort = (sort: ItemSortMode): Prisma.ItemOrderByWithRelationInput[] => {
  if (sort === "oldest" || sort === "stale_first") return [{ acquiredAt: "asc" }, { id: "asc" }];
  if (sort === "highest_cost") return [{ costBasisCents: "desc" }, { id: "desc" }];
  if (sort === "highest_list_price") return [{ currentListPriceCents: { sort: "desc", nulls: "last" } }, { id: "desc" }];
  return [{ createdAt: "desc" }, { id: "desc" }];
};
