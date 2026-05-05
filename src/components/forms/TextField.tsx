import type { InputHTMLAttributes } from "react";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const TextField = ({ label, error, className = "", ...props }: TextFieldProps) => (
  <label className="block">
    <span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span>
    <input className={`tap w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-50 ${className}`} {...props} />
    {error ? <span className="mt-1 block text-sm text-red-600">{error}</span> : null}
  </label>
);
