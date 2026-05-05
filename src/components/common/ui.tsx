import type { ButtonHTMLAttributes, ReactNode } from "react";
import { MoreVertical } from "lucide-react";
import { Link } from "react-router-dom";

export const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(" ");

export const PageHeader = ({
  title,
  eyebrow,
  actions,
  back,
  onBack
}: {
  title: string;
  eyebrow?: string;
  actions?: ReactNode;
  back?: boolean;
  onBack?: () => void;
}) => (
  <div className="mb-4 flex items-center justify-between gap-3 md:mb-6">
    <div className="flex min-w-0 items-center gap-2">
      {back ? (
        <button className="tap -ml-2 rounded-full px-2 text-ink md:hidden" onClick={onBack ?? (() => history.back())} aria-label="Go back">
          ‹
        </button>
      ) : null}
      <div className="min-w-0">
        {eyebrow ? <p className="text-xs font-medium text-muted">{eyebrow}</p> : null}
        <h2 className="truncate text-lg font-bold md:text-xl">{title}</h2>
      </div>
    </div>
    <div className="flex items-center gap-2">{actions ?? <IconButton label="More"><MoreVertical size={18} /></IconButton>}</div>
  </div>
);

export const IconButton = ({ label, className, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) => (
  <button className={cx("tap grid min-w-11 place-items-center rounded-xl border border-slate-200 bg-white px-3 text-sm text-ink shadow-card", className)} aria-label={label} title={label} {...props}>
    {children}
  </button>
);

export const PrimaryButton = ({ className, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button className={cx("tap rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white shadow-card transition hover:bg-primary-700 disabled:opacity-50", className)} {...props}>
    {children}
  </button>
);

export const SecondaryButton = ({ className, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button className={cx("tap rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-primary-600 shadow-card", className)} {...props}>
    {children}
  </button>
);

export const SurfaceCard = ({ children, className }: { children: ReactNode; className?: string }) => (
  <section className={cx("app-card p-4", className)}>{children}</section>
);

export const Pill = ({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "warning" | "danger" | "primary" }) => {
  const tones = {
    neutral: "bg-slate-100 text-slate-600",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-orange-100 text-orange-700",
    danger: "bg-red-100 text-red-700",
    primary: "bg-primary-100 text-primary-700"
  };
  return <span className={cx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", tones[tone])}>{children}</span>;
};

export const ActionTile = ({ icon, label, onClick, href, tone = "primary" }: { icon: ReactNode; label: string; onClick?: () => void; href?: string; tone?: "primary" | "success" | "info" | "warning" | "neutral" }) => {
  const tones = {
    primary: "bg-primary-600",
    success: "bg-emerald-500",
    info: "bg-blue-500",
    warning: "bg-orange-500",
    neutral: "bg-slate-500"
  };
  const body = (
    <>
      <span className={cx("grid h-9 w-9 place-items-center rounded-xl text-white", tones[tone])}>{icon}</span>
      <span className="font-semibold">{label}</span>
    </>
  );
  if (href) return <Link className="tap flex items-center gap-3 rounded-xl bg-slate-50 px-3 text-sm transition hover:bg-slate-100" to={href}>{body}</Link>;
  return <button className="tap flex w-full items-center gap-3 rounded-xl bg-slate-50 px-3 text-left text-sm transition hover:bg-slate-100" onClick={onClick}>{body}</button>;
};

export const EmptyAction = ({ title, text, action }: { title: string; text: string; action?: ReactNode }) => (
  <div className="app-card p-6 text-center">
    <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-primary-50 text-primary-600">+</div>
    <h3 className="font-semibold">{title}</h3>
    <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{text}</p>
    {action ? <div className="mt-4">{action}</div> : null}
  </div>
);
