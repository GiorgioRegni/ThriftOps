import { useEffect, useState } from "react";
import { DateInput } from "../components/forms/DateInput";
import { MoneyInput } from "../components/forms/MoneyInput";
import { SelectField } from "../components/forms/SelectField";
import { TextField } from "../components/forms/TextField";
import { ReportTable } from "../components/reports/ReportTable";
import { centsFromDecimal, formatMoney } from "../lib/money";
import { timestampFromInput, todayInput } from "../lib/dates";
import { useOrg } from "../hooks/useOrg";
import { createPayment, updatePaymentMatch } from "../services/paymentService";
import { getReconciliationData, type ReconciliationPayment, type ReconciliationSale, type ReconciliationSuggestion } from "../services/reconciliationService";
import { linkPaymentToSales } from "../services/saleService";
import type { PaymentSource } from "../types/domain";

export const Reconciliation = () => {
  const { org } = useOrg();
  const [payments, setPayments] = useState<ReconciliationPayment[]>([]);
  const [sales, setSales] = useState<ReconciliationSale[]>([]);
  const [suggestions, setSuggestions] = useState<ReconciliationSuggestion[]>([]);
  const [selectedPayment, setSelectedPayment] = useState("");
  const [selectedSales, setSelectedSales] = useState<string[]>([]);
  const [form, setForm] = useState({ date: todayInput(), source: "venmo", amount: "", externalTransactionId: "", counterparty: "", note: "" });
  const refresh = async () => {
    if (!org) return;
    const data = await getReconciliationData(org.id);
    setPayments(data.payments);
    setSales(data.sales);
    setSuggestions(data.suggestions);
  };
  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [org]);
  if (!org) return null;
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Reconciliation</h2>
      <form className="grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-3" onSubmit={async (event) => {
        event.preventDefault();
        await createPayment(org.id, { date: timestampFromInput(form.date), source: form.source as PaymentSource, amountCents: centsFromDecimal(form.amount), externalTransactionId: form.externalTransactionId, counterparty: form.counterparty, note: form.note });
        await refresh();
      }}>
        <DateInput label="Payment date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
        <SelectField label="Source" value={form.source} onChange={(event) => setForm({ ...form, source: event.target.value })} options={["venmo", "paypal", "noihsaf", "stripe", "cash", "bank", "other"].map((value) => ({ value, label: value }))} />
        <MoneyInput label="Amount" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} />
        <TextField label="External transaction ID" value={form.externalTransactionId} onChange={(event) => setForm({ ...form, externalTransactionId: event.target.value })} />
        <TextField label="Counterparty" value={form.counterparty} onChange={(event) => setForm({ ...form, counterparty: event.target.value })} />
        <TextField label="Note" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} />
        <button className="tap rounded-md bg-ink px-4 text-white md:col-span-3">Create payment</button>
      </form>
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border bg-white p-4">
          <h3 className="font-semibold">Unmatched payments</h3>
          <div className="mt-3 space-y-2">{payments.map((payment) => <label key={payment.id} className="flex gap-2 text-sm"><input type="radio" name="payment" value={payment.id} checked={selectedPayment === payment.id} onChange={() => setSelectedPayment(payment.id)} /> {payment.source} · {formatMoney(payment.amountCents)} · {new Date(payment.date).toLocaleDateString()}</label>)}</div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <h3 className="font-semibold">Sales needing payout match</h3>
          <div className="mt-3 space-y-2">{sales.map((sale) => <label key={sale.id} className="flex gap-2 text-sm"><input type="checkbox" checked={selectedSales.includes(sale.id)} onChange={(event) => setSelectedSales(event.target.checked ? [...selectedSales, sale.id] : selectedSales.filter((id) => id !== sale.id))} /> {sale.channel} · {formatMoney(sale.totalReceivedCents)} · {new Date(sale.soldAt).toLocaleDateString()}</label>)}</div>
        </div>
      </section>
      <button className="tap rounded-md bg-ink px-4 text-white" disabled={!selectedPayment || !selectedSales.length} onClick={async () => {
        await updatePaymentMatch(org.id, selectedPayment, selectedSales, "matched");
        await linkPaymentToSales(org.id, selectedSales, selectedPayment);
        await refresh();
        setSelectedPayment("");
        setSelectedSales([]);
      }}>Link payment to selected sales</button>
      <ReportTable columns={["payment", "sale", "amount", "reason"]} rows={suggestions.map((suggestion) => ({ ...suggestion, amount: formatMoney(suggestion.amountCents) }))} />
    </div>
  );
};
