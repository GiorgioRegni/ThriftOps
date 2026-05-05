import type { InputHTMLAttributes } from "react";

interface MoneyInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const MoneyInput = ({ label, error, ...props }: MoneyInputProps) => (
  <label className="block">
    <span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span>
    <div className="flex rounded-xl border border-slate-200 bg-white transition focus-within:border-primary-500 focus-within:ring-4 focus-within:ring-primary-50">
      <span className="grid w-10 place-items-center text-sm text-muted">$</span>
      <input className="tap min-w-0 flex-1 rounded-r-xl px-2 text-sm outline-none" inputMode="decimal" placeholder="0.00" {...props} />
    </div>
    {error ? <span className="mt-1 block text-sm text-red-600">{error}</span> : null}
  </label>
);
