import type { InputHTMLAttributes } from "react";
import { todayInput } from "../../lib/dates";

export const DateInput = ({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) => (
  <label className="block">
    <span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span>
    <input className="tap w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-50" type="date" defaultValue={todayInput()} {...props} />
  </label>
);
