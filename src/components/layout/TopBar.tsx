import { LogOut } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useOrg } from "../../hooks/useOrg";
import { logout } from "../../services/authService";

export const TopBar = () => {
  const { user } = useAuth();
  const { org } = useOrg();
  return (
    <header className="sticky top-0 z-20 border-b bg-white/95 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <div>
          <p className="text-xs text-muted">{org?.name ?? "ThriftOps"}</p>
          <h1 className="text-lg font-semibold">thriftops</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-muted sm:inline">{user?.email}</span>
          <button className="tap rounded-md border px-3 text-sm" onClick={() => void logout()} aria-label="Log out"><LogOut size={18} /></button>
        </div>
      </div>
    </header>
  );
};
