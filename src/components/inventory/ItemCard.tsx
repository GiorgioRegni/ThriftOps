import { Link } from "react-router-dom";
import { differenceInCalendarDays } from "date-fns";
import { formatMoney } from "../../lib/money";
import type { Item } from "../../types/domain";
import { ItemStatusBadge } from "./ItemStatusBadge";

export const ItemCard = ({ item }: { item: Item }) => (
  <Link to={`/inventory/${item.id}`} className="block rounded-2xl border border-slate-100 bg-white p-2.5 shadow-card transition hover:-translate-y-0.5 hover:shadow-soft">
    <div className="flex gap-3">
      <div className="h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-slate-100 to-slate-200">
        {item.photos[0] ? <img className="h-full w-full object-cover" src={item.photos[0].url} alt={item.title} loading="lazy" decoding="async" /> : <div className="grid h-full place-items-center text-xs font-semibold text-muted">No photo</div>}
      </div>
      <div className="min-w-0 flex-1 py-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-muted">{item.itemCode}</p>
            <h3 className="truncate text-sm font-bold">{item.brand || "Unknown"} {item.itemType || item.title}</h3>
          </div>
          <ItemStatusBadge status={item.status} />
        </div>
        <p className="mt-1 text-xs text-muted">Size {item.size || "-"} · {item.material || item.category.replaceAll("_", " ")}</p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="text-sm font-bold">{formatMoney(item.currentListPriceCents || item.costBasisCents)}</p>
          <p className="text-xs font-medium text-muted">{differenceInCalendarDays(new Date(), new Date(item.acquiredAt))}d</p>
        </div>
      </div>
    </div>
  </Link>
);
