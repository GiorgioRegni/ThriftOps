import { useMemo, useState } from "react";
import { z } from "zod";
import { Plus, Search, ShoppingCart } from "lucide-react";
import { DateInput } from "../components/forms/DateInput";
import { MoneyInput } from "../components/forms/MoneyInput";
import { SelectField } from "../components/forms/SelectField";
import { TextField } from "../components/forms/TextField";
import { QRScanner } from "../components/inventory/QRScanner";
import { SaleCart } from "../components/sales/SaleCart";
import { centsFromDecimal, formatMoney } from "../lib/money";
import { timestampFromInput, todayInput } from "../lib/dates";
import { useAuth } from "../hooks/useAuth";
import { useOrg } from "../hooks/useOrg";
import { useItems } from "../hooks/useItems";
import { useEvents } from "../hooks/useEvents";
import { createSale, type SaleCartItem } from "../services/saleService";
import type { PaymentMethod, SaleChannel } from "../types/domain";
import { EmptyAction, PageHeader, PrimaryButton, SecondaryButton, SurfaceCard } from "../components/common/ui";

const schema = z.object({ soldAt: z.string().min(1), channel: z.string().min(1), paymentMethod: z.string().min(1) });

export const Sell = () => {
  const { org } = useOrg();
  const { user } = useAuth();
  const { items, refresh } = useItems();
  const { events } = useEvents();
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<SaleCartItem[]>([]);
  const [scanOpen, setScanOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    soldAt: todayInput(),
    channel: "in_person_market",
    eventId: "",
    paymentMethod: "cash",
    discount: "",
    shippingCharged: "",
    salesTaxCollected: "",
    marketplaceCollectedTax: false,
    platformFee: "",
    paymentFee: "",
    actualShippingCost: "",
    packagingCost: "",
    otherCost: "",
    payoutStatus: "not_applicable",
    buyerName: "",
    notes: ""
  });
  const matches = useMemo(() => {
    const term = search.toLowerCase();
    return items.filter((item) => item.status !== "sold").filter((item) => [item.itemCode, item.brand, item.title, item.itemType].some((value) => value.toLowerCase().includes(term))).slice(0, 8);
  }, [items, search]);
  if (!org || !user) return null;
  const addItem = (itemId: string) => {
    const item = items.find((candidate) => candidate.id === itemId || candidate.itemCode === itemId || `thriftops:item:${candidate.itemCode}` === itemId);
    if (!item || cart.some((cartItem) => cartItem.item.id === item.id)) return;
    setCart([...cart, { item, salePriceCents: item.currentListPriceCents ?? 0 }]);
  };
  const setValue = (key: keyof typeof form, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));
  const gross = cart.reduce((sum, cartItem) => sum + cartItem.salePriceCents, 0);
  const discount = centsFromDecimal(form.discount);
  const shippingCharged = centsFromDecimal(form.shippingCharged);
  const tax = centsFromDecimal(form.salesTaxCollected);
  const totalReceived = gross - discount + shippingCharged + tax;
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <PageHeader title="Sell" back actions={<button className="tap rounded-xl px-3 text-sm font-bold text-primary-600" onClick={() => setCart([])}>Clear Cart</button>} />
      <SurfaceCard>
        <TextField label="Find item" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Scan or search item code, brand, title" />
        <div className="mt-2 flex gap-2">
          <SecondaryButton type="button" onClick={() => setScanOpen(!scanOpen)}><Search size={16} className="mr-2 inline" />Scan QR</SecondaryButton>
        </div>
        {scanOpen ? <div className="mt-3"><QRScanner onScan={(value) => { addItem(value); setScanOpen(false); }} /></div> : null}
        {search ? <div className="mt-3 space-y-2">{matches.map((item) => <button key={item.id} className="tap flex w-full items-center justify-between rounded-xl bg-slate-50 px-3 text-left text-sm" onClick={() => addItem(item.id)}><span>{item.itemCode} · {item.brand} {item.itemType}</span><Plus size={16} /></button>)}</div> : null}
      </SurfaceCard>
      <section>
        <h3 className="mb-2 text-sm font-bold">Items in Cart ({cart.length})</h3>
        {cart.length ? <SaleCart items={cart} onRemove={(itemId) => setCart(cart.filter((cartItem) => cartItem.item.id !== itemId))} onPriceChange={(itemId, value) => setCart(cart.map((cartItem) => cartItem.item.id === itemId ? { ...cartItem, salePriceCents: centsFromDecimal(value) } : cartItem))} /> : <EmptyAction title="Cart is empty" text="Search or scan inventory to add items to this sale." />}
      </section>
      <form
        className="app-card space-y-4 p-4"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!cart.length) return setMessage("Add at least one item.");
          const parsed = schema.safeParse(form);
          if (!parsed.success) return setMessage(parsed.error.issues[0]?.message ?? "Check sale fields.");
          try {
            const result = await createSale(org.id, user.uid, {
              soldAt: timestampFromInput(form.soldAt),
              channel: form.channel as SaleChannel,
              eventId: form.eventId || undefined,
              paymentMethod: form.paymentMethod as PaymentMethod,
              buyerName: form.buyerName,
              discountCents: centsFromDecimal(form.discount),
              shippingChargedCents: centsFromDecimal(form.shippingCharged),
              salesTaxCollectedCents: centsFromDecimal(form.salesTaxCollected),
              marketplaceCollectedTax: form.marketplaceCollectedTax,
              platformFeeCents: centsFromDecimal(form.platformFee),
              paymentFeeCents: centsFromDecimal(form.paymentFee),
              actualShippingCostCents: centsFromDecimal(form.actualShippingCost),
              packagingCostCents: centsFromDecimal(form.packagingCost),
              otherCostCents: centsFromDecimal(form.otherCost),
              payoutStatus: form.payoutStatus as "not_applicable",
              notes: form.notes,
              items: cart
            });
            setMessage(`Sale saved. Estimated net profit ${formatMoney(result.netProfitCents)}.`);
            setCart([]);
            await refresh();
          } catch (err) {
            setMessage(err instanceof Error ? err.message : "Unable to save sale.");
          }
        }}
      >
        <div className="grid gap-4 md:grid-cols-3">
          <DateInput label="Sold at" value={form.soldAt} onChange={(event) => setValue("soldAt", event.target.value)} />
          <SelectField label="Channel" value={form.channel} onChange={(event) => setValue("channel", event.target.value)} options={["in_person_market", "noihsaf", "facebook_marketplace", "instagram", "own_website", "venmo_direct", "paypal_direct", "cash", "other"].map((value) => ({ value, label: value.replaceAll("_", " ") }))} />
          <SelectField label="Event" value={form.eventId} onChange={(event) => setValue("eventId", event.target.value)} options={[{ value: "", label: "No event" }, ...events.map((event) => ({ value: event.id, label: event.name }))]} />
          <SelectField label="Payment method" value={form.paymentMethod} onChange={(event) => setValue("paymentMethod", event.target.value)} options={["cash", "venmo", "paypal", "stripe", "card", "marketplace_payout", "other"].map((value) => ({ value, label: value.replaceAll("_", " ") }))} />
          <MoneyInput label="Discount" value={form.discount} onChange={(event) => setValue("discount", event.target.value)} />
          <MoneyInput label="Shipping charged" value={form.shippingCharged} onChange={(event) => setValue("shippingCharged", event.target.value)} />
          <MoneyInput label="Actual shipping" value={form.actualShippingCost} onChange={(event) => setValue("actualShippingCost", event.target.value)} />
          <MoneyInput label="Packaging cost" value={form.packagingCost} onChange={(event) => setValue("packagingCost", event.target.value)} />
          <MoneyInput label="Platform fee" value={form.platformFee} onChange={(event) => setValue("platformFee", event.target.value)} />
          <MoneyInput label="Payment fee" value={form.paymentFee} onChange={(event) => setValue("paymentFee", event.target.value)} />
          <MoneyInput label="Sales tax collected" value={form.salesTaxCollected} onChange={(event) => setValue("salesTaxCollected", event.target.value)} />
          <MoneyInput label="Other cost" value={form.otherCost} onChange={(event) => setValue("otherCost", event.target.value)} />
          <TextField label="Buyer note" value={form.buyerName} onChange={(event) => setValue("buyerName", event.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.marketplaceCollectedTax} onChange={(event) => setValue("marketplaceCollectedTax", event.target.checked)} />
          Marketplace collected sales tax
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">Notes</span>
          <textarea className="min-h-20 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-50" value={form.notes} onChange={(event) => setValue("notes", event.target.value)} />
        </label>
        <div className="rounded-2xl bg-slate-50 p-4 text-sm">
          <div className="flex justify-between"><span className="text-muted">Item Subtotal</span><strong>{formatMoney(gross)}</strong></div>
          <div className="mt-2 flex justify-between"><span className="text-muted">Discount</span><strong>-{formatMoney(discount)}</strong></div>
          <div className="mt-2 flex justify-between"><span className="text-muted">Shipping Charged</span><strong>{formatMoney(shippingCharged)}</strong></div>
          <div className="mt-2 flex justify-between"><span className="text-muted">Sales Tax Collected</span><strong>{formatMoney(tax)}</strong></div>
          <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-base"><span className="font-bold">Total Received</span><strong>{formatMoney(totalReceived)}</strong></div>
        </div>
        <div className="sticky bottom-20 z-10 rounded-2xl bg-white/90 p-2 backdrop-blur md:static md:p-0">
          <PrimaryButton className="w-full"><ShoppingCart size={16} className="mr-2 inline" />Review Sale</PrimaryButton>
        </div>
      </form>
      {message ? <p className="rounded-md bg-white p-3 text-sm">{message}</p> : null}
    </div>
  );
};
