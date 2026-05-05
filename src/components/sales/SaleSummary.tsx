import { saleLevelNetProfit } from "../../lib/calculations";
import { formatMoney } from "../../lib/money";
import type { Sale, SaleItem } from "../../types/domain";

export const SaleSummary = ({ sale, saleItems }: { sale: Sale; saleItems: SaleItem[] }) => (
  <div className="rounded-lg border bg-white p-4">
    <h3 className="font-semibold">Sale summary</h3>
    <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
      <dt className="text-muted">Gross</dt><dd className="text-right">{formatMoney(sale.grossItemSubtotalCents)}</dd>
      <dt className="text-muted">Fees</dt><dd className="text-right">{formatMoney(sale.platformFeeCents + sale.paymentFeeCents)}</dd>
      <dt className="text-muted">Shipping P/L</dt><dd className="text-right">{formatMoney(sale.shippingChargedCents - sale.actualShippingCostCents - sale.packagingCostCents)}</dd>
      <dt className="font-semibold">Net profit</dt><dd className="text-right font-semibold">{formatMoney(saleLevelNetProfit(sale, saleItems))}</dd>
    </dl>
  </div>
);
