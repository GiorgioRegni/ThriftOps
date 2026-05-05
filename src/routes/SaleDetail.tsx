import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PageHeader, Pill, SurfaceCard } from "../components/common/ui";
import { Loading } from "../components/common/Loading";
import { formatMoney } from "../lib/money";
import { saleLevelNetProfit } from "../lib/calculations";
import { useOrg } from "../hooks/useOrg";
import { getSaleDetail, type SaleDetailResponse } from "../services/saleService";

export const SaleDetail = () => {
  const { saleId } = useParams();
  const { org } = useOrg();
  const [detail, setDetail] = useState<SaleDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    if (!org || !saleId) return;
    setLoading(true);
    setError("");
    try {
      setDetail(await getSaleDetail(org.id, saleId));
    } catch (err) {
      setDetail(null);
      setError(err instanceof Error ? err.message : "Unable to load sale.");
    } finally {
      setLoading(false);
    }
  }, [org, saleId]);
  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (loading) return <Loading />;
  if (!detail) {
    return (
      <div className="space-y-4">
        <PageHeader title="Sale Detail" back />
        <SurfaceCard>
          <p className="text-sm text-muted">{error || "Sale not found."}</p>
          <Link className="mt-3 inline-flex text-sm font-semibold text-primary-600" to="/sales">Back to sales</Link>
        </SurfaceCard>
      </div>
    );
  }

  const { sale, items: saleItems } = detail;
  const netProfit = saleLevelNetProfit(sale, saleItems);
  const fees = sale.platformFeeCents + sale.paymentFeeCents;
  const shippingNet = sale.shippingChargedCents - sale.actualShippingCostCents - sale.packagingCostCents;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader title="Sale Detail" back actions={<Pill tone={sale.payoutStatus === "matched" ? "success" : "warning"}>{sale.payoutStatus.replaceAll("_", " ")}</Pill>} />
      <SurfaceCard>
        <p className="text-sm font-semibold">{new Date(sale.soldAt).toLocaleString()}</p>
        <div className="mt-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-3xl font-bold">{formatMoney(sale.grossItemSubtotalCents)}</p>
            <p className="mt-1 text-sm font-semibold text-primary-600">{sale.channel.replaceAll("_", " ")}</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-4 gap-2 text-sm">
          <div><p className="text-xs text-muted">Items</p><p className="font-bold">{saleItems.length}</p></div>
          <div><p className="text-xs text-muted">Shipping</p><p className="font-bold text-emerald-600">{formatMoney(shippingNet)}</p></div>
          <div><p className="text-xs text-muted">Fees</p><p className="font-bold text-red-600">-{formatMoney(fees)}</p></div>
          <div><p className="text-xs text-muted">Net Profit</p><p className="font-bold text-emerald-600">{formatMoney(netProfit)}</p></div>
        </div>
      </SurfaceCard>
      <SurfaceCard>
        <h3 className="mb-3 font-bold">Items Sold</h3>
        <div className="space-y-3">
          {saleItems.map((saleItem) => (
            <div key={saleItem.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-2">
              <div className="min-w-0">
                <p className="text-sm font-bold">{saleItem.itemCode}</p>
                <p className="truncate text-xs text-muted">{saleItem.titleSnapshot}</p>
              </div>
              <div className="text-right text-sm">
                <p className="font-bold">{formatMoney(saleItem.allocatedSalePriceCents)}</p>
                <p className="text-xs font-semibold text-emerald-600">{formatMoney(saleItem.netProfitCents)}</p>
              </div>
            </div>
          ))}
        </div>
      </SurfaceCard>
      <SurfaceCard>
        <h3 className="mb-3 font-bold">Breakdown</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Item Subtotal</dt><dd>{formatMoney(sale.grossItemSubtotalCents)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Shipping Charged</dt><dd>{formatMoney(sale.shippingChargedCents)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Discount</dt><dd>-{formatMoney(sale.discountCents)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Sales Tax Collected</dt><dd>{formatMoney(sale.salesTaxCollectedCents)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Platform Fee</dt><dd>-{formatMoney(sale.platformFeeCents)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Payment Fee</dt><dd>-{formatMoney(sale.paymentFeeCents)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Actual Shipping Cost</dt><dd>-{formatMoney(sale.actualShippingCostCents)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Packaging Cost</dt><dd>-{formatMoney(sale.packagingCostCents)}</dd></div>
        </dl>
      </SurfaceCard>
    </div>
  );
};
