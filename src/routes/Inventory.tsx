import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { SlidersHorizontal } from "lucide-react";
import { ItemCard } from "../components/inventory/ItemCard";
import { ItemSearch } from "../components/inventory/ItemSearch";
import { SelectField } from "../components/forms/SelectField";
import { useItems } from "../hooks/useItems";
import { EmptyAction, IconButton, PageHeader } from "../components/common/ui";

export const Inventory = () => {
  const { items } = useItems();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("newest");
  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return items
      .filter((item) => !status || item.status === status)
      .filter((item) => !category || item.category === category)
      .filter((item) => [item.itemCode, item.brand, item.title, item.itemType, item.size, item.material, item.sourceVendor].some((value) => value.toLowerCase().includes(term)))
      .sort((a, b) => {
        if (sort === "oldest") return new Date(a.acquiredAt).getTime() - new Date(b.acquiredAt).getTime();
        if (sort === "highest_cost") return b.costBasisCents - a.costBasisCents;
        if (sort === "highest_list_price") return (b.currentListPriceCents ?? 0) - (a.currentListPriceCents ?? 0);
        if (sort === "stale_first") return new Date(a.acquiredAt).getTime() - new Date(b.acquiredAt).getTime();
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [category, items, search, sort, status]);
  return (
    <div className="space-y-4">
      <PageHeader title="Inventory" actions={<IconButton label="Filters"><SlidersHorizontal size={18} /></IconButton>} />
      <div className="flex gap-2">
        <div className="min-w-0 flex-1"><ItemSearch value={search} onChange={setSearch} /></div>
        <IconButton label="Filters"><SlidersHorizontal size={18} /></IconButton>
      </div>
      <div className="grid gap-2 rounded-2xl bg-white p-3 shadow-card sm:grid-cols-3">
        <SelectField label="Status" value={status} onChange={(event) => setStatus(event.target.value)} options={[{ value: "", label: "All statuses" }, ...["draft", "active", "listed", "reserved", "sold", "donated", "lost", "returned"].map((value) => ({ value, label: value }))]} />
        <SelectField label="Category" value={category} onChange={(event) => setCategory(event.target.value)} options={[{ value: "", label: "All categories" }, { value: "women", label: "Women" }, { value: "kids", label: "Kids" }, { value: "home_goods", label: "Home goods" }, { value: "uncategorized", label: "Uncategorized" }]} />
        <SelectField label="Sort" value={sort} onChange={(event) => setSort(event.target.value)} options={[{ value: "newest", label: "Newest" }, { value: "oldest", label: "Oldest" }, { value: "highest_cost", label: "Highest cost" }, { value: "highest_list_price", label: "Highest list price" }, { value: "stale_first", label: "Stale first" }]} />
      </div>
      {filtered.length ? <div className="grid gap-3 lg:grid-cols-2">{filtered.map((item) => <ItemCard key={item.id} item={item} />)}</div> : <EmptyAction title="No items found" text="Add inventory or adjust your filters." action={<Link className="tap inline-flex items-center rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white" to="/inventory/new">Add item</Link>} />}
    </div>
  );
};
