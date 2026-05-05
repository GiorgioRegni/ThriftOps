import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ReportTable } from "../components/reports/ReportTable";
import { formatMoney } from "../lib/money";
import { Loading } from "../components/common/Loading";
import { useOrg } from "../hooks/useOrg";
import { listSalesSummary, type SaleSummaryRow } from "../services/saleService";
import { EmptyAction, PageHeader, Pill, SecondaryButton } from "../components/common/ui";

const pageSize = 25;

export const Sales = () => {
  const { org } = useOrg();
  const [channel, setChannel] = useState("");
  const [multiOnly, setMultiOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<SaleSummaryRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const refresh = useCallback(async () => {
    if (!org) return;
    setLoading(true);
    setError("");
    try {
      const result = await listSalesSummary(org.id, { page, pageSize, channel, multiOnly });
      setRows(result.rows);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load sales.");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [channel, multiOnly, org, page]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  useEffect(() => {
    setPage(1);
  }, [channel, multiOnly]);
  useEffect(() => {
    if (!loading && page > totalPages) setPage(totalPages);
  }, [loading, page, totalPages]);
  const displayRows = useMemo(() => rows.map((sale) => ({
    id: sale.id,
    date: new Date(sale.soldAt).toLocaleDateString(),
    channel: sale.channel.replaceAll("_", " "),
    gross: formatMoney(sale.grossItemSubtotalCents),
    netProfit: formatMoney(sale.netProfitCents),
    itemCount: sale.itemCount,
    payoutStatus: sale.payoutStatus
  })), [rows]);
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
      {error ? <div className="rounded-2xl border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-700">{error}</div> : null}
      {loading ? <Loading label="Loading sales..." /> : displayRows.length ? (
        <>
          <div className="flex flex-col gap-3 rounded-2xl bg-white p-3 shadow-card sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-muted">Showing <span className="font-semibold text-ink">{(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)}</span> of <span className="font-semibold text-ink">{total}</span> sales</p>
            <div className="flex items-center gap-2">
              <SecondaryButton className="grid min-w-11 place-items-center px-3" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1} aria-label="Previous page" title="Previous page"><ChevronLeft size={18} /></SecondaryButton>
              <span className="min-w-20 text-center text-sm font-semibold text-slate-700">Page {page} of {totalPages}</span>
              <SecondaryButton className="grid min-w-11 place-items-center px-3" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page === totalPages} aria-label="Next page" title="Next page"><ChevronRight size={18} /></SecondaryButton>
            </div>
          </div>
          <div className="space-y-2 md:hidden">
            {displayRows.map((row) => (
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
          <div className="hidden md:block"><ReportTable columns={["date", "channel", "gross", "netProfit", "itemCount", "payoutStatus"]} rows={displayRows} /></div>
        </>
      ) : <EmptyAction title="No sales yet" text="Create a sale to see sale history and payout matching." action={<Link className="tap inline-flex items-center rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white" to="/sell">Create sale</Link>} />}
    </div>
  );
};
