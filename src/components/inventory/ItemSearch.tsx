import { Search } from "lucide-react";

export const ItemSearch = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
  <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-white px-3 shadow-card">
    <Search size={18} className="text-muted" />
    <input className="tap min-w-0 flex-1 bg-transparent text-sm outline-none" value={value} onChange={(event) => onChange(event.target.value)} placeholder="Search items" />
  </div>
);
