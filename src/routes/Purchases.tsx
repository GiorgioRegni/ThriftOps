import { useState } from "react";
import { DateInput } from "../components/forms/DateInput";
import { MoneyInput } from "../components/forms/MoneyInput";
import { SelectField } from "../components/forms/SelectField";
import { TextField } from "../components/forms/TextField";
import { ReportTable } from "../components/reports/ReportTable";
import { centsFromDecimal, formatMoney } from "../lib/money";
import { timestampFromInput, todayInput } from "../lib/dates";
import { useAuth } from "../hooks/useAuth";
import { useOrg } from "../hooks/useOrg";
import { usePurchases } from "../hooks/usePurchases";
import { createPurchase } from "../services/purchaseService";

export const Purchases = () => {
  const { org } = useOrg();
  const { user } = useAuth();
  const { purchases, refresh } = usePurchases();
  const [form, setForm] = useState({ date: todayInput(), vendor: "Goodwill", location: "", total: "", subtotal: "", tax: "", paymentAccount: "", paymentMethod: "", allocationMode: "unallocated", notes: "" });
  if (!org || !user) return null;
  const rows = purchases.map((purchase) => ({ date: new Date(purchase.date).toLocaleDateString(), vendor: purchase.vendor, total: formatMoney(purchase.totalCents), allocated: formatMoney(purchase.allocatedTotalCents), unallocated: formatMoney(purchase.unallocatedCents), mode: purchase.allocationMode }));
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Purchases</h2>
      <form className="grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-3" onSubmit={async (event) => {
        event.preventDefault();
        await createPurchase(org.id, user.uid, { date: timestampFromInput(form.date), vendor: form.vendor, location: form.location, totalCents: centsFromDecimal(form.total), subtotalCents: centsFromDecimal(form.subtotal), taxCents: centsFromDecimal(form.tax), paymentAccount: form.paymentAccount, paymentMethod: form.paymentMethod, itemIds: [], allocationMode: form.allocationMode as "unallocated", notes: form.notes });
        await refresh();
      }}>
        <DateInput label="Date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
        <TextField label="Vendor" value={form.vendor} onChange={(event) => setForm({ ...form, vendor: event.target.value })} />
        <TextField label="Location" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} />
        <MoneyInput label="Total" value={form.total} onChange={(event) => setForm({ ...form, total: event.target.value })} />
        <MoneyInput label="Subtotal" value={form.subtotal} onChange={(event) => setForm({ ...form, subtotal: event.target.value })} />
        <MoneyInput label="Tax" value={form.tax} onChange={(event) => setForm({ ...form, tax: event.target.value })} />
        <TextField label="Payment account" value={form.paymentAccount} onChange={(event) => setForm({ ...form, paymentAccount: event.target.value })} />
        <TextField label="Payment method" value={form.paymentMethod} onChange={(event) => setForm({ ...form, paymentMethod: event.target.value })} />
        <SelectField label="Allocation mode" value={form.allocationMode} onChange={(event) => setForm({ ...form, allocationMode: event.target.value })} options={["exact", "equal", "manual", "unallocated"].map((value) => ({ value, label: value }))} />
        <button className="tap rounded-md bg-ink px-4 text-white md:col-span-3">Create purchase</button>
      </form>
      <ReportTable columns={["date", "vendor", "total", "allocated", "unallocated", "mode"]} rows={rows} />
    </div>
  );
};
