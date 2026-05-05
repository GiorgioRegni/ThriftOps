import { useState } from "react";
import { DateInput } from "../components/forms/DateInput";
import { MoneyInput } from "../components/forms/MoneyInput";
import { TextField } from "../components/forms/TextField";
import { MetricCard } from "../components/reports/MetricCard";
import { ReportTable } from "../components/reports/ReportTable";
import { centsFromDecimal, formatMoney } from "../lib/money";
import { timestampFromInput, todayInput } from "../lib/dates";
import { useAuth } from "../hooks/useAuth";
import { useOrg } from "../hooks/useOrg";
import { useEvents } from "../hooks/useEvents";
import { useSales } from "../hooks/useSales";
import { createEvent } from "../services/eventService";

export const Events = () => {
  const { org } = useOrg();
  const { user } = useAuth();
  const { events, refresh } = useEvents();
  const { sales, saleItemsBySale } = useSales();
  const [form, setForm] = useState({ name: "", date: todayInput(), location: "", boothFee: "", notes: "" });
  if (!org || !user) return null;
  const selected = events[0];
  const selectedSales = selected ? sales.filter((sale) => sale.eventId === selected.id) : [];
  const gross = selectedSales.reduce((sum, sale) => sum + sale.grossItemSubtotalCents, 0);
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Events</h2>
      <form className="grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-3" onSubmit={async (event) => {
        event.preventDefault();
        await createEvent(org.id, user.uid, { name: form.name, date: timestampFromInput(form.date), location: form.location, boothFeeCents: centsFromDecimal(form.boothFee), notes: form.notes });
        await refresh();
      }}>
        <TextField label="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <DateInput label="Date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
        <TextField label="Location" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} />
        <MoneyInput label="Booth fee" value={form.boothFee} onChange={(event) => setForm({ ...form, boothFee: event.target.value })} />
        <button className="tap rounded-md bg-ink px-4 text-white md:col-span-3">Create event</button>
      </form>
      {selected ? <section className="grid gap-3 sm:grid-cols-4"><MetricCard label="Latest event gross" value={formatMoney(gross)} /><MetricCard label="Items sold" value={String(selectedSales.flatMap((sale) => saleItemsBySale[sale.id] ?? []).length)} /><MetricCard label="AOV" value={formatMoney(selectedSales.length ? Math.round(gross / selectedSales.length) : 0)} /><MetricCard label="Profit after booth" value={formatMoney(gross - selected.boothFeeCents)} /></section> : null}
      <ReportTable columns={["date", "name", "location", "boothFee"]} rows={events.map((event) => ({ date: new Date(event.date).toLocaleDateString(), name: event.name, location: event.location, boothFee: formatMoney(event.boothFeeCents) }))} />
    </div>
  );
};
