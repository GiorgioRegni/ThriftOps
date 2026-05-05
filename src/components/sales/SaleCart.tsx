import { Trash2 } from "lucide-react";
import { MoneyInput } from "../forms/MoneyInput";
import { formatMoney } from "../../lib/money";
import type { SaleCartItem } from "../../services/saleService";

export const SaleCart = ({ items, onPriceChange, onRemove }: { items: SaleCartItem[]; onPriceChange: (itemId: string, value: string) => void; onRemove: (itemId: string) => void }) => (
  <div className="space-y-2">
    {items.map((cartItem) => (
      <div key={cartItem.item.id} className="app-card p-3">
        <div className="flex items-start gap-3">
          <div className="h-16 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100">
            {cartItem.item.photos[0] ? <img src={cartItem.item.photos[0].url} alt={cartItem.item.title} className="h-full w-full object-cover" /> : null}
          </div>
          <div>
            <p className="text-xs font-semibold text-muted">{cartItem.item.itemCode}</p>
            <p className="font-medium">{cartItem.item.brand} {cartItem.item.itemType}</p>
            <p className="text-xs text-muted">Cost {formatMoney(cartItem.item.costBasisCents)}</p>
          </div>
          <button className="tap ml-auto rounded-xl p-2 text-red-600" onClick={() => onRemove(cartItem.item.id)} aria-label="Remove item"><Trash2 size={18} /></button>
        </div>
        <div className="mt-3">
          <MoneyInput label="Sale price" value={(cartItem.salePriceCents / 100 || "").toString()} onChange={(event) => onPriceChange(cartItem.item.id, event.target.value)} />
        </div>
      </div>
    ))}
  </div>
);
