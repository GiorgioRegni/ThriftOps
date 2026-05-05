import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { Loading } from "./components/common/Loading";
import { useAuth } from "./hooks/useAuth";
import { useOrg } from "./hooks/useOrg";
import { Dashboard } from "./routes/Dashboard";
import { Login } from "./routes/Login";
import { Onboarding } from "./routes/Onboarding";
import { Inventory } from "./routes/Inventory";
import { AddItem } from "./routes/AddItem";
import { ItemDetail } from "./routes/ItemDetail";
import { Sell } from "./routes/Sell";
import { Sales } from "./routes/Sales";
import { SaleDetail } from "./routes/SaleDetail";
import { Purchases } from "./routes/Purchases";
import { Expenses } from "./routes/Expenses";
import { Events } from "./routes/Events";
import { Reconciliation } from "./routes/Reconciliation";
import { Reports } from "./routes/Reports";
import { Imports } from "./routes/Imports";
import { Settings } from "./routes/Settings";
import { FirebaseSetup } from "./routes/FirebaseSetup";
import { isFirebaseConfigured, useFirebaseEmulators } from "./lib/firebase";

const Protected = () => {
  const { user, loading: authLoading } = useAuth();
  const { org, loading: orgLoading, error: orgError, refreshOrgs } = useOrg();
  const location = useLocation();
  if (authLoading || orgLoading) return <Loading />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (orgError) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 p-4">
        <section className="w-full max-w-md rounded-lg border bg-white p-5 shadow-sm">
          <h1 className="text-xl font-semibold">Unable to load workspace</h1>
          <p className="mt-2 text-sm text-muted">{orgError}</p>
          <p className="mt-3 text-sm text-muted">Confirm the API is running and Firebase Admin credentials are configured.</p>
          <button className="tap mt-5 rounded-md bg-ink px-4 py-2 text-sm font-medium text-white" onClick={() => void refreshOrgs()}>Retry</button>
        </section>
      </main>
    );
  }
  if (!org && location.pathname !== "/onboarding") return <Navigate to="/onboarding" replace />;
  return <AppShell />;
};

export const App = () => {
  if (!isFirebaseConfigured && !useFirebaseEmulators) return <FirebaseSetup />;

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route element={<Protected />}>
        <Route index element={<Dashboard />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/inventory/new" element={<AddItem />} />
        <Route path="/inventory/:itemId" element={<ItemDetail />} />
        <Route path="/sell" element={<Sell />} />
      <Route path="/sales" element={<Sales />} />
      <Route path="/sales/:saleId" element={<SaleDetail />} />
        <Route path="/purchases" element={<Purchases />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/events" element={<Events />} />
        <Route path="/reconciliation" element={<Reconciliation />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/imports" element={<Imports />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
};
