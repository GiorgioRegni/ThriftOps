import { useCallback, useEffect, useState } from "react";
import { DateInput } from "../components/forms/DateInput";
import { MoneyInput } from "../components/forms/MoneyInput";
import { TextField } from "../components/forms/TextField";
import { MetricCard } from "../components/reports/MetricCard";
import { ReportTable } from "../components/reports/ReportTable";
import { centsFromDecimal, formatMoney } from "../lib/money";
import { timestampFromInput, todayInput } from "../lib/dates";
import { useAuth } from "../hooks/useAuth";
import { useOrg } from "../hooks/useOrg";
import { createEvent, getEventSummary, type EventSummaryData } from "../services/eventService";
import { Loading } from "../components/common/Loading";

export const Events = () => {
  const { org } = useOrg();
  const { user } = useAuth();
  const [summary, setSummary] = useState<EventSummaryData>({ events: [], latest: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", date: todayInput(), location: "", boothFee: "", notes: "" });
  const refresh = useCallback(async () => {
    if (!org) return;
    setLoading(true);
    setError("");
    try {
      setSummary(await getEventSummary(org.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load events.");
    } finally {
      setLoading(false);
    }
  }, [org]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  if (!org || !user) return null;
  if (loading) return <Loading label="Loading events..." />;
  if (error) return <div className="rounded-2xl border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-700">{error}</div>;
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
      {summary.latest ? <section className="grid gap-3 sm:grid-cols-4"><MetricCard label="Latest event gross" value={formatMoney(summary.latest.grossCents)} /><MetricCard label="Items sold" value={String(summary.latest.itemCount)} /><MetricCard label="AOV" value={formatMoney(summary.latest.averageOrderValueCents)} /><MetricCard label="Profit after booth" value={formatMoney(summary.latest.profitAfterBoothCents)} /></section> : null}
      <ReportTable columns={["date", "name", "location", "boothFee"]} rows={summary.events.map((event) => ({ date: new Date(event.date).toLocaleDateString(), name: event.name, location: event.location, boothFee: formatMoney(event.boothFeeCents) }))} />
    </div>
  );
};
