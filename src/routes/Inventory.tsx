import { useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { ItemCard } from "../components/inventory/ItemCard";
import { ItemSearch } from "../components/inventory/ItemSearch";
import { SelectField } from "../components/forms/SelectField";
import { Loading } from "../components/common/Loading";
import { useInventoryItems, type InventoryItemsQuery } from "../hooks/useInventoryItems";
import { inventoryPageSizes, inventorySortModes, type InventorySortMode } from "../services/itemService";
import { EmptyAction, IconButton, PageHeader, SecondaryButton } from "../components/common/ui";
import type { Category, ItemStatus } from "../types/domain";

const statuses: ItemStatus[] = ["draft", "active", "listed", "reserved", "sold", "donated", "lost", "returned"];
const categories: Category[] = ["women", "kids", "home_goods", "uncategorized"];
const defaultPage = 1;
const defaultPageSize = 24;
const defaultSort: InventorySortMode = "newest";

const firstParam = (params: URLSearchParams, key: string) => params.get(key)?.trim() ?? "";

const positiveInteger = (value: string, fallback: number) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const inventoryQueryFromParams = (params: URLSearchParams): InventoryItemsQuery => {
  const pageSize = positiveInteger(firstParam(params, "pageSize"), defaultPageSize);
  const status = firstParam(params, "status");
  const category = firstParam(params, "category");
  const sort = firstParam(params, "sort");

  return {
    page: positiveInteger(firstParam(params, "page"), defaultPage),
    pageSize: inventoryPageSizes.includes(pageSize as (typeof inventoryPageSizes)[number]) ? pageSize : defaultPageSize,
    search: firstParam(params, "search"),
    status: statuses.includes(status as ItemStatus) ? status as ItemStatus : "",
    category: categories.includes(category as Category) ? category as Category : "",
    sort: inventorySortModes.includes(sort as InventorySortMode) ? sort as InventorySortMode : defaultSort
  };
};

const paramsFromInventoryQuery = (query: InventoryItemsQuery) => {
  const params = new URLSearchParams();
  if (query.page !== defaultPage) params.set("page", String(query.page));
  if (query.pageSize !== defaultPageSize) params.set("pageSize", String(query.pageSize));
  if (query.sort !== defaultSort) params.set("sort", query.sort);
  if (query.search) params.set("search", query.search);
  if (query.status) params.set("status", query.status);
  if (query.category) params.set("category", query.category);
  return params;
};

export const Inventory = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParamsText = searchParams.toString();
  const query = useMemo(() => inventoryQueryFromParams(searchParams), [searchParamsText]);
  const { items, total, loading, error } = useInventoryItems(query);
  const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
  const pageStart = total ? Math.min((query.page - 1) * query.pageSize + 1, total) : 0;
  const pageEnd = Math.min(query.page * query.pageSize, total);

  const setQuery = (patch: Partial<InventoryItemsQuery>, resetPage = true) => {
    const nextQuery = { ...query, ...patch, page: resetPage ? 1 : patch.page ?? query.page };
    setSearchParams(paramsFromInventoryQuery(nextQuery));
  };

  useEffect(() => {
    const canonical = paramsFromInventoryQuery(query);
    if (canonical.toString() !== searchParamsText) setSearchParams(canonical, { replace: true });
  }, [query, searchParamsText, setSearchParams]);

  useEffect(() => {
    if (!loading && query.page > totalPages) {
      setSearchParams(paramsFromInventoryQuery({ ...query, page: totalPages }), { replace: true });
    }
  }, [loading, query, setSearchParams, totalPages]);

  return (
    <div className="space-y-4">
      <PageHeader title="Inventory" actions={<IconButton label="Filters"><SlidersHorizontal size={18} /></IconButton>} />
      <div className="flex gap-2">
        <div className="min-w-0 flex-1"><ItemSearch value={query.search} onChange={(value) => setQuery({ search: value })} /></div>
        <IconButton label="Filters"><SlidersHorizontal size={18} /></IconButton>
      </div>
      <div className="grid gap-2 rounded-2xl bg-white p-3 shadow-card sm:grid-cols-3">
        <SelectField label="Status" value={query.status} onChange={(event) => setQuery({ status: event.target.value as ItemStatus | "" })} options={[{ value: "", label: "All statuses" }, ...statuses.map((value) => ({ value, label: value }))]} />
        <SelectField label="Category" value={query.category} onChange={(event) => setQuery({ category: event.target.value as Category | "" })} options={[{ value: "", label: "All categories" }, { value: "women", label: "Women" }, { value: "kids", label: "Kids" }, { value: "home_goods", label: "Home goods" }, { value: "uncategorized", label: "Uncategorized" }]} />
        <SelectField label="Sort" value={query.sort} onChange={(event) => setQuery({ sort: event.target.value as InventorySortMode })} options={[{ value: "newest", label: "Newest" }, { value: "oldest", label: "Oldest" }, { value: "highest_cost", label: "Highest cost" }, { value: "highest_list_price", label: "Highest list price" }, { value: "stale_first", label: "Stale first" }]} />
      </div>
      {error ? <div className="rounded-2xl border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-700">{error}</div> : null}
      {loading ? <Loading label="Loading inventory..." /> : total ? (
        <>
          <div className="flex flex-col gap-3 rounded-2xl bg-white p-3 shadow-card sm:flex-row sm:items-end sm:justify-between">
            <p className="text-sm font-medium text-muted">
              Showing <span className="font-semibold text-ink">{pageStart}-{pageEnd}</span> of <span className="font-semibold text-ink">{total}</span> items
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <SelectField
                label="Items per page"
                value={String(query.pageSize)}
                onChange={(event) => setQuery({ pageSize: Number(event.target.value) })}
                options={inventoryPageSizes.map((value) => ({ value: String(value), label: String(value) }))}
              />
              <div className="flex items-center gap-2">
                <SecondaryButton className="grid min-w-11 place-items-center px-3" onClick={() => setQuery({ page: Math.max(1, query.page - 1) }, false)} disabled={query.page === 1} aria-label="Previous page" title="Previous page">
                  <ChevronLeft size={18} />
                </SecondaryButton>
                <span className="min-w-20 text-center text-sm font-semibold text-slate-700">Page {query.page} of {totalPages}</span>
                <SecondaryButton className="grid min-w-11 place-items-center px-3" onClick={() => setQuery({ page: Math.min(totalPages, query.page + 1) }, false)} disabled={query.page === totalPages} aria-label="Next page" title="Next page">
                  <ChevronRight size={18} />
                </SecondaryButton>
              </div>
            </div>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">{items.map((item) => <ItemCard key={item.id} item={item} />)}</div>
        </>
      ) : <EmptyAction title="No items found" text="Add inventory or adjust your filters." action={<Link className="tap inline-flex items-center rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white" to="/inventory/new">Add item</Link>} />}
    </div>
  );
};
