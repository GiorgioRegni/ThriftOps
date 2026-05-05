import { NavLink, Outlet } from "react-router-dom";
import { BarChart3, CalendarDays, ChevronDown, FileDown, Home, Package, Receipt, Repeat, Settings, ShoppingBag, ShoppingCart } from "lucide-react";
import { BottomNav } from "./BottomNav";
import { useAuth } from "../../hooks/useAuth";
import { useOrg } from "../../hooks/useOrg";

const navLinks = [
  { to: "/dashboard", label: "Dashboard", icon: Home },
  { to: "/inventory", label: "Inventory", icon: Package },
  { to: "/sell", label: "Sell", icon: ShoppingCart },
  { to: "/sales", label: "Sales", icon: Receipt },
  { to: "/purchases", label: "Purchases", icon: ShoppingBag },
  { to: "/expenses", label: "Expenses", icon: Receipt },
  { to: "/events", label: "Events", icon: CalendarDays },
  { to: "/reconciliation", label: "Reconcile", icon: Repeat },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/imports", label: "Imports", icon: FileDown },
  { to: "/settings", label: "Settings", icon: Settings }
];

export const AppShell = () => {
  const { user } = useAuth();
  const { org } = useOrg();
  return (
    <div className="min-h-screen bg-wash mobile-safe-bottom md:pb-0">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-100 bg-white p-5 md:flex md:flex-col">
        <div className="mb-7 flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-2xl bg-primary-50 text-primary-600">
            <ShoppingBag size={20} />
          </div>
          <span className="text-xl font-bold tracking-tight">thriftops</span>
        </div>
        <nav className="flex-1 space-y-1">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${isActive ? "bg-primary-50 text-primary-700" : "text-slate-700 hover:bg-slate-50"}`}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-5 flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">{(user?.email?.[0] ?? "T").toUpperCase()}</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{user?.displayName || user?.email || "User"}</p>
            <p className="truncate text-xs text-muted">{org?.name ?? "ThriftOps"}</p>
          </div>
          <ChevronDown size={16} className="text-muted" />
        </div>
      </aside>
      <main className="min-w-0 p-4 md:ml-64 md:p-7">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  );
};
