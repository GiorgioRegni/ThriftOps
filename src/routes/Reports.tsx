import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { MetricCard } from "../components/reports/MetricCard";
import { ReportTable } from "../components/reports/ReportTable";
import { formatMoney } from "../lib/money";
import { averageItemSalePrice, cogsForDateRange, shippingProfitLoss } from "../lib/calculations";
import { useItems } from "../hooks/useItems";
import { useSales } from "../hooks/useSales";
import { agingRows, dashboardMetrics, profitByField } from "../services/reportService";
import { exportAllWorkbook, exportCsv } from "../services/exportService";
import { PageHeader, PrimaryButton, SecondaryButton, cx } from "../components/common/ui";

export const Reports = () => {
  const { items } = useItems();
  const { sales, saleItemsBySale } = useSales();
  const saleItems = useMemo(() => Object.values(saleItemsBySale).flat(), [saleItemsBySale]);
  const metrics = dashboardMetrics(items, sales, saleItemsBySale, []);
  const brandRows = profitByField(items, saleItems, "brand");
  const materialRows = profitByField(items, saleItems, "material");
  const typeRows = profitByField(items, saleItems, "itemType");
  const [tab, setTab] = useState<"overview" | "brand" | "aging" | "channel" | "more">("brand");
  const byChannel = Object.values(sales.reduce<Record<string, { channel: string; grossSales: string; platformFees: number; paymentFees: number; shippingCharged: number; shippingCost: number; cogs: number; netProfit: number; margin: string }>>((acc, sale) => {
    const row = acc[sale.channel] ?? { channel: sale.channel, grossSales: "$0.00", platformFees: 0, paymentFees: 0, shippingCharged: 0, shippingCost: 0, cogs: 0, netProfit: 0, margin: "0%" };
    const related = saleItemsBySale[sale.id] ?? [];
    const cogs = related.reduce((sum, saleItem) => sum + saleItem.costBasisCents, 0);
    const net = related.reduce((sum, saleItem) => sum + saleItem.netProfitCents, 0);
    row.platformFees += sale.platformFeeCents;
    row.paymentFees += sale.paymentFeeCents;
    row.shippingCharged += sale.shippingChargedCents;
    row.shippingCost += sale.actualShippingCostCents + sale.packagingCostCents;
    row.cogs += cogs;
    row.netProfit += net;
    row.grossSales = formatMoney((Number(row.grossSales.replace(/[$,]/g, "")) * 100 || 0) + sale.grossItemSubtotalCents);
    row.margin = sale.grossItemSubtotalCents ? `${Math.round((row.netProfit / sale.grossItemSubtotalCents) * 100)}%` : "0%";
    acc[sale.channel] = row;
    return acc;
  }, {})).map((row) => ({ ...row, platformFees: formatMoney(row.platformFees), paymentFees: formatMoney(row.paymentFees), shippingCharged: formatMoney(row.shippingCharged), shippingCost: formatMoney(row.shippingCost), cogs: formatMoney(row.cogs), netProfit: formatMoney(row.netProfit) }));
  const soldItemCount = saleItems.length;
  const gross = sales.reduce((sum, sale) => sum + sale.grossItemSubtotalCents, 0);
  const groupColumns = ["group", "activeCount", "soldCount", "grossSales", "cogs", "netProfit", "avgProfit", "sellThrough", "medianDaysHeld"];
  const groupRows = (rows: typeof brandRows) => rows.map((row) => ({
    group: row.group,
    activeCount: row.activeCount,
    soldCount: row.soldCount,
    grossSales: formatMoney(row.grossSalesCents),
    cogs: formatMoney(row.cogsCents),
    netProfit: formatMoney(row.netProfitCents),
    avgProfit: formatMoney(row.averageProfitPerSoldItemCents),
    sellThrough: `${Math.round(row.sellThroughProxy * 100)}%`,
    medianDaysHeld: row.medianDaysHeld
  }));
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "brand", label: "Profit by Brand" },
    { id: "aging", label: "Aging" },
    { id: "channel", label: "Channel" },
    { id: "more", label: "More" }
  ] as const;
  return (
    <div className="space-y-5">
      <PageHeader title="Reports" back actions={<PrimaryButton onClick={() => exportAllWorkbook({ items, sales, saleItems, expenses: [], purchases: [], payments: [], events: [] })}><Download size={16} className="mr-2 inline" />Export</PrimaryButton>} />
      <div className="overflow-x-auto border-b border-slate-200">
        <div className="flex min-w-max gap-5">
          {tabs.map((candidate) => (
            <button key={candidate.id} className={cx("tap border-b-2 px-1 text-sm font-semibold", tab === candidate.id ? "border-primary-600 text-primary-600" : "border-transparent text-muted")} onClick={() => setTab(candidate.id)}>
              {candidate.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button className="tap rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold shadow-card">Apr 15 – May 15, 2026</button>
        <SecondaryButton onClick={() => exportCsv("items.csv", items as unknown as Record<string, unknown>[])}>Export CSV</SecondaryButton>
      </div>
      {tab === "overview" ? (
        <section className="grid gap-3 sm:grid-cols-4">
          <MetricCard label="Active inventory" value={formatMoney(metrics.activeInventoryValueCents)} />
          <MetricCard label="COGS all time" value={formatMoney(cogsForDateRange(items, new Date(2000, 0, 1), new Date(2100, 0, 1)))} />
          <MetricCard label="Average item sale price" value={formatMoney(averageItemSalePrice(gross, soldItemCount))} />
          <MetricCard label="Shipping P/L" value={formatMoney(sales.reduce((sum, sale) => sum + shippingProfitLoss(sale.shippingChargedCents, sale.actualShippingCostCents, sale.packagingCostCents), 0))} />
        </section>
      ) : null}
      {tab === "brand" ? <ReportTable columns={groupColumns} rows={groupRows(brandRows)} /> : null}
      {tab === "aging" ? <ReportTable columns={["bucket", "itemCount", "totalCostBasis", "suggestedAction"]} rows={agingRows(items).map((row) => ({ ...row, totalCostBasis: formatMoney(row.totalCostBasisCents) }))} /> : null}
      {tab === "channel" ? <ReportTable columns={["channel", "grossSales", "platformFees", "paymentFees", "shippingCharged", "shippingCost", "cogs", "netProfit", "margin"]} rows={byChannel} /> : null}
      {tab === "more" ? (
        <div className="space-y-4">
          <ReportTable columns={["itemCode", "brand", "itemType", "category", "cost", "soldPrice", "netProfit", "daysHeld", "channel"]} rows={saleItems.map((saleItem) => ({ itemCode: saleItem.itemCode, brand: saleItem.brandSnapshot, itemType: saleItem.itemTypeSnapshot, category: saleItem.categorySnapshot, cost: formatMoney(saleItem.costBasisCents), soldPrice: formatMoney(saleItem.allocatedSalePriceCents), netProfit: formatMoney(saleItem.netProfitCents), daysHeld: saleItem.daysHeld, channel: sales.find((sale) => sale.id === saleItem.saleId)?.channel }))} />
          <ReportTable columns={groupColumns} rows={[...groupRows(materialRows), ...groupRows(typeRows)]} />
          <ReportTable columns={["report", "value"]} rows={[{ report: "Shipping charged", value: formatMoney(sales.reduce((sum, sale) => sum + sale.shippingChargedCents, 0)) }, { report: "Actual shipping and packaging", value: formatMoney(sales.reduce((sum, sale) => sum + sale.actualShippingCostCents + sale.packagingCostCents, 0)) }, { report: "Ending inventory active count", value: metrics.activeItemCount }, { report: "Direct sales tax collected", value: formatMoney(sales.filter((sale) => !sale.marketplaceCollectedTax).reduce((sum, sale) => sum + sale.salesTaxCollectedCents, 0)) }, { report: "Marketplace collected tax sales", value: formatMoney(sales.filter((sale) => sale.marketplaceCollectedTax).reduce((sum, sale) => sum + sale.grossItemSubtotalCents, 0)) }]} />
        </div>
      ) : null}
    </div>
  );
};
