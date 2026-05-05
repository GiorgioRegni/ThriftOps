import type { ReactNode } from "react";

export const MetricCard = ({ label, value, icon, trend }: { label: string; value: string; icon?: ReactNode; trend?: string }) => (
  <div className="app-card p-4">
    <div className="flex items-start justify-between gap-3">
      <p className="text-xs font-semibold text-muted">{label}</p>
      {icon ? <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-50 text-primary-600">{icon}</span> : null}
    </div>
    <p className="mt-3 text-2xl font-bold tracking-tight">{value}</p>
    {trend ? <p className="mt-2 text-xs font-semibold text-emerald-600">{trend}</p> : null}
  </div>
);
