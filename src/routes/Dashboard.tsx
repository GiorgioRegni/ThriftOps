import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, DollarSign, FileDown, Package, Plus, Receipt, ShoppingCart, Tag, TrendingUp, Wallet } from "lucide-react";
import { MetricCard } from "../components/reports/MetricCard";
import { formatMoney } from "../lib/money";
import { ItemCard } from "../components/inventory/ItemCard";
import { Loading } from "../components/common/Loading";
import { useOrg } from "../hooks/useOrg";
import { getDashboardData, type DashboardData } from "../services/dashboardService";
import { ActionTile, EmptyAction, PageHeader, SurfaceCard } from "../components/common/ui";

export const Dashboard = () => {
  const { org } = useOrg();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!org) return;
    setLoading(true);
    setError("");
    try {
      setData(await getDashboardData(org.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load dashboard.");
    } finally {
      setLoading(false);
    }
  }, [org]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (loading) return <Loading label="Loading dashboard..." />;
  if (error) return <div className="rounded-2xl border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-700">{error}</div>;
  if (!data) return null;

  const { metrics, recentSales, staleItems } = data;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Dashboard"
        actions={<button className="tap flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold shadow-card"><CalendarDays size={16} /> This Month</button>}
      />
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Gross Sales" value={formatMoney(metrics.grossSalesThisMonthCents)} icon={<DollarSign size={18} />} trend="this month" />
        <MetricCard label="Net Profit (est.)" value={formatMoney(metrics.netProfitThisMonthCents)} icon={<TrendingUp size={18} />} trend="after COGS" />
        <MetricCard label="Active Inventory Value" value={formatMoney(metrics.activeInventoryValueCents)} icon={<Package size={18} />} />
        <MetricCard label="Active Item Count" value={String(metrics.activeItemCount)} icon={<Tag size={18} />} />
        <MetricCard label="Sold Items" value={String(metrics.soldItemsThisMonth)} />
        <MetricCard label="Avg. Order Value" value={formatMoney(metrics.averageOrderValueCents)} />
        <MetricCard label="Multi-Item Sale Rate" value={`${Math.round(metrics.multiItemSaleRate * 100)}%`} />
        <MetricCard label="Shipping Profit / Loss" value={formatMoney(metrics.shippingProfitLossCents)} />
        <MetricCard label="Stale Inventory (90+ days)" value={String(metrics.staleInventoryCount90Plus)} />
        <MetricCard label="Unmatched Payments" value={String(metrics.unmatchedPaymentCount)} />
      </section>
      <section className="grid gap-4 xl:grid-cols-[1fr_1fr_300px]">
        <SurfaceCard>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-bold">Recent Sales</h3>
            <Link className="text-xs font-semibold text-primary-600" to="/sales">View all</Link>
          </div>
          <div className="space-y-3">
            {recentSales.map((sale) => (
              <Link to={`/sales/${sale.id}`} key={sale.id} className="flex items-center justify-between gap-3 rounded-xl px-1 py-1 text-sm hover:bg-slate-50">
                <div>
                  <p className="font-semibold">{formatMoney(sale.grossItemSubtotalCents)}</p>
                  <p className="text-xs text-muted">{sale.channel.replaceAll("_", " ")} · {sale.itemCount} items</p>
                </div>
                <p className="text-sm font-bold text-emerald-600">{formatMoney(sale.grossItemSubtotalCents)}</p>
              </Link>
            ))}
            {!recentSales.length ? <EmptyAction title="No sales yet" text="Complete your first sale to see revenue and profit here." action={<Link className="tap inline-flex items-center rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white" to="/sell">Sell item</Link>} /> : null}
          </div>
        </SurfaceCard>
        <SurfaceCard>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-bold">Stale Inventory (90+ days)</h3>
            <Link className="text-xs font-semibold text-primary-600" to="/inventory">View all</Link>
          </div>
          <div className="space-y-2">{staleItems.length ? staleItems.map((item) => <ItemCard key={item.id} item={item} />) : <EmptyAction title="No active inventory" text="Add items to start tracking aging and resale value." action={<Link className="tap inline-flex items-center rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white" to="/inventory/new">Add item</Link>} />}</div>
        </SurfaceCard>
        <SurfaceCard>
          <h3 className="mb-3 font-bold">Quick Actions</h3>
          <div className="space-y-2">
            <ActionTile href="/inventory/new" label="Add Item" icon={<Plus size={18} />} />
            <ActionTile href="/sell" label="Sell Item" icon={<ShoppingCart size={18} />} tone="success" />
            <ActionTile href="/purchases" label="New Purchase" icon={<Receipt size={18} />} tone="info" />
            <ActionTile href="/expenses" label="New Expense" icon={<Wallet size={18} />} tone="warning" />
            <ActionTile href="/imports" label="Import Spreadsheet" icon={<FileDown size={18} />} tone="neutral" />
          </div>
        </SurfaceCard>
      </section>
    </div>
  );
};
