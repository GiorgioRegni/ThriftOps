import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { Loading } from "./components/common/Loading";
import { useAuth } from "./hooks/useAuth";
import { useOrg } from "./hooks/useOrg";
import { FirebaseSetup } from "./routes/FirebaseSetup";
import { isFirebaseConfigured, useFirebaseEmulators } from "./lib/firebase";

const Login = lazy(() => import("./routes/Login").then((module) => ({ default: module.Login })));
const Onboarding = lazy(() => import("./routes/Onboarding").then((module) => ({ default: module.Onboarding })));
const Dashboard = lazy(() => import("./routes/Dashboard").then((module) => ({ default: module.Dashboard })));
const Inventory = lazy(() => import("./routes/Inventory").then((module) => ({ default: module.Inventory })));
const AddItem = lazy(() => import("./routes/AddItem").then((module) => ({ default: module.AddItem })));
const ItemDetail = lazy(() => import("./routes/ItemDetail").then((module) => ({ default: module.ItemDetail })));
const Sell = lazy(() => import("./routes/Sell").then((module) => ({ default: module.Sell })));
const Sales = lazy(() => import("./routes/Sales").then((module) => ({ default: module.Sales })));
const SaleDetail = lazy(() => import("./routes/SaleDetail").then((module) => ({ default: module.SaleDetail })));
const Purchases = lazy(() => import("./routes/Purchases").then((module) => ({ default: module.Purchases })));
const Expenses = lazy(() => import("./routes/Expenses").then((module) => ({ default: module.Expenses })));
const Events = lazy(() => import("./routes/Events").then((module) => ({ default: module.Events })));
const Reconciliation = lazy(() => import("./routes/Reconciliation").then((module) => ({ default: module.Reconciliation })));
const Reports = lazy(() => import("./routes/Reports").then((module) => ({ default: module.Reports })));
const Imports = lazy(() => import("./routes/Imports").then((module) => ({ default: module.Imports })));
const Settings = lazy(() => import("./routes/Settings").then((module) => ({ default: module.Settings })));

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
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route element={<Protected />}>
          <Route index element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
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
    </Suspense>
  );
};
