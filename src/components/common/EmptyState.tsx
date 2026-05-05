import type { ReactNode } from "react";

export const EmptyState = ({ title, children }: { title: string; children?: ReactNode }) => (
  <div className="app-card border-dashed p-6 text-center">
    <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-primary-50 text-primary-600">+</div>
    <h3 className="text-base font-semibold">{title}</h3>
    {children ? <div className="mt-2 text-sm text-muted">{children}</div> : null}
  </div>
);
