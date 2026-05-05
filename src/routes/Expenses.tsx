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
import { useExpenses } from "../hooks/useExpenses";
import { createExpense } from "../services/expenseService";
import type { ExpenseCategory } from "../types/domain";

const categories: ExpenseCategory[] = ["inventory_purchase", "shipping", "packaging", "market_booth_fee", "cleaning_repair", "software", "mileage", "supplies", "payment_fee", "platform_fee", "other"];

export const Expenses = () => {
  const { org } = useOrg();
  const { user } = useAuth();
  const { expenses, refresh } = useExpenses();
  const [form, setForm] = useState({ date: todayInput(), category: "other", vendor: "", amount: "", paymentMethod: "", taxDeductible: true, notes: "" });
  if (!org || !user) return null;
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Expenses</h2>
      <form className="grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-3" onSubmit={async (event) => {
        event.preventDefault();
        await createExpense(org.id, user.uid, { date: timestampFromInput(form.date), category: form.category as ExpenseCategory, vendor: form.vendor, amountCents: centsFromDecimal(form.amount), paymentMethod: form.paymentMethod, taxDeductible: form.taxDeductible, notes: form.notes });
        await refresh();
      }}>
        <DateInput label="Date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
        <SelectField label="Category" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} options={categories.map((value) => ({ value, label: value.replaceAll("_", " ") }))} />
        <TextField label="Vendor" value={form.vendor} onChange={(event) => setForm({ ...form, vendor: event.target.value })} />
        <MoneyInput label="Amount" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} />
        <TextField label="Payment method" value={form.paymentMethod} onChange={(event) => setForm({ ...form, paymentMethod: event.target.value })} />
        <label className="tap flex items-center gap-2 text-sm"><input type="checkbox" checked={form.taxDeductible} onChange={(event) => setForm({ ...form, taxDeductible: event.target.checked })} /> Tax deductible</label>
        <button className="tap rounded-md bg-ink px-4 text-white md:col-span-3">Create expense</button>
      </form>
      <ReportTable columns={["date", "category", "vendor", "amount", "paymentMethod"]} rows={expenses.map((expense) => ({ date: new Date(expense.date).toLocaleDateString(), category: expense.category, vendor: expense.vendor, amount: formatMoney(expense.amountCents), paymentMethod: expense.paymentMethod }))} />
    </div>
  );
};
