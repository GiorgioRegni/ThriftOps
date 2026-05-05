import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ReportTable } from "../components/reports/ReportTable";
import { formatMoney } from "../lib/money";
import { saleLevelNetProfit } from "../lib/calculations";
import { useSales } from "../hooks/useSales";
import { EmptyAction, PageHeader, Pill, SurfaceCard } from "../components/common/ui";

export const Sales = () => {
  const { sales, saleItemsBySale } = useSales();
  const [channel, setChannel] = useState("");
  const [multiOnly, setMultiOnly] = useState(false);
  const rows = useMemo(() => sales
    .filter((sale) => !channel || sale.channel === channel)
    .filter((sale) => !multiOnly || (saleItemsBySale[sale.id] ?? []).length >= 2)
    .map((sale) => ({
      id: sale.id,
      date: new Date(sale.soldAt).toLocaleDateString(),
      channel: sale.channel.replaceAll("_", " "),
      gross: formatMoney(sale.grossItemSubtotalCents),
      netProfit: formatMoney(saleLevelNetProfit(sale, saleItemsBySale[sale.id] ?? [])),
      itemCount: (saleItemsBySale[sale.id] ?? []).length,
      payoutStatus: sale.payoutStatus
    })), [channel, multiOnly, saleItemsBySale, sales]);
  return (
    <div className="space-y-4">
      <PageHeader title="Sales" />
      <div className="flex flex-wrap gap-2 rounded-2xl bg-white p-3 shadow-card">
        <select className="tap rounded-xl border border-slate-200 px-3 text-sm" value={channel} onChange={(event) => setChannel(event.target.value)}>
          <option value="">All channels</option>
          {["in_person_market", "noihsaf", "facebook_marketplace", "instagram", "cash", "other"].map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}
        </select>
        <label className="tap flex items-center gap-2 px-2 text-sm"><input type="checkbox" checked={multiOnly} onChange={(event) => setMultiOnly(event.target.checked)} /> Multi-item only</label>
      </div>
      {rows.length ? (
        <>
          <div className="space-y-2 md:hidden">
            {rows.map((row) => (
              <Link key={row.id} to={`/sales/${row.id}`} className="app-card block p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-muted">{row.date}</p>
                    <p className="mt-1 text-xl font-bold">{row.gross}</p>
                    <p className="mt-1 text-sm text-primary-600">{row.channel}</p>
                  </div>
                  <Pill tone={row.payoutStatus === "matched" ? "success" : "warning"}>{row.payoutStatus}</Pill>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                  <div><p className="text-xs text-muted">Items</p><p className="font-bold">{row.itemCount}</p></div>
                  <div><p className="text-xs text-muted">Net Profit</p><p className="font-bold text-emerald-600">{row.netProfit}</p></div>
                  <div><p className="text-xs text-muted">Channel</p><p className="truncate font-bold">{row.channel}</p></div>
                </div>
              </Link>
            ))}
          </div>
          <div className="hidden md:block"><ReportTable columns={["date", "channel", "gross", "netProfit", "itemCount", "payoutStatus"]} rows={rows} /></div>
        </>
      ) : <EmptyAction title="No sales yet" text="Create a sale to see sale history and payout matching." action={<Link className="tap inline-flex items-center rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white" to="/sell">Create sale</Link>} />}
    </div>
  );
};
