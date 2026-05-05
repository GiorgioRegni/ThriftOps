import { BarChart3, Home, Package, Plus, ShoppingCart } from "lucide-react";
import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Dashboard", icon: Home },
  { to: "/inventory", label: "Inventory", icon: Package },
  { to: "/sell", label: "Sell", icon: ShoppingCart },
  { to: "/reports", label: "Reports", icon: BarChart3 }
];

export const BottomNav = () => (
  <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-100 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(15,23,42,0.06)] backdrop-blur md:hidden">
    <div className="grid grid-cols-5 items-end px-3 py-2">
      {links.slice(0, 2).map(({ to, label, icon: Icon }) => (
        <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => `tap flex flex-col items-center justify-center gap-1 px-1 text-[11px] font-semibold ${isActive ? "text-primary-600" : "text-muted"}`}>
          <Icon size={20} />
          <span>{label}</span>
        </NavLink>
      ))}
      <NavLink to="/inventory/new" className="flex flex-col items-center gap-1 text-[11px] font-semibold text-primary-600">
        <span className="-mt-7 grid h-14 w-14 place-items-center rounded-full bg-primary-600 text-white shadow-soft ring-4 ring-white">
          <Plus size={26} />
        </span>
        <span>Add</span>
      </NavLink>
      {links.slice(2).map(({ to, label, icon: Icon }) => (
        <NavLink key={to} to={to} className={({ isActive }) => `tap flex flex-col items-center justify-center gap-1 px-1 text-[11px] font-semibold ${isActive ? "text-primary-600" : "text-muted"}`}>
          <Icon size={20} />
          <span>{label}</span>
        </NavLink>
      ))}
    </div>
  </nav>
);
