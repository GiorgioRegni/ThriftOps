import { toCsv, downloadTextFile } from "../lib/csv";
import { downloadWorkbook } from "../lib/excel";
import { profitByField, agingRows } from "./reportService";
import type { Event, Expense, Item, Payment, Purchase, Sale, SaleItem } from "../types/domain";

const flattenDate = (value: unknown): unknown => value;

export const flattenRecord = (record: Record<string, unknown>): Record<string, unknown> =>
  Object.fromEntries(Object.entries(record).map(([key, value]) => [key, Array.isArray(value) || (value && typeof value === "object") ? JSON.stringify(value) : flattenDate(value)]));

export const exportCsv = (filename: string, rows: Record<string, unknown>[]): void => downloadTextFile(filename, toCsv(rows.map(flattenRecord)));

export interface ExportDataset {
  items: Item[];
  sales: Sale[];
  saleItems: SaleItem[];
  expenses: Expense[];
  purchases: Purchase[];
  payments: Payment[];
  events: Event[];
}

export const exportAllWorkbook = (dataset: ExportDataset): void => {
  const itemRows = dataset.items.map((item) => flattenRecord(item as unknown as Record<string, unknown>));
  const saleRows = dataset.sales.map((sale) => flattenRecord(sale as unknown as Record<string, unknown>));
  const saleItemRows = dataset.saleItems.map((saleItem) => flattenRecord(saleItem as unknown as Record<string, unknown>));
  const expenseRows = dataset.expenses.map((expense) => flattenRecord(expense as unknown as Record<string, unknown>));
  downloadWorkbook("thriftops-export.xlsx", {
    "Active Inventory": itemRows.filter((row) => ["draft", "active", "listed", "reserved"].includes(String(row.status))),
    "Sold Inventory": itemRows.filter((row) => row.status === "sold"),
    Sales: saleRows,
    "Sale Items": saleItemRows,
    Expenses: expenseRows,
    Purchases: dataset.purchases.map((purchase) => flattenRecord(purchase as unknown as Record<string, unknown>)),
    Payments: dataset.payments.map((payment) => flattenRecord(payment as unknown as Record<string, unknown>)),
    Events: dataset.events.map((event) => flattenRecord(event as unknown as Record<string, unknown>)),
    "Profit by Brand": profitByField(dataset.items, dataset.saleItems, "brand").map((row) => flattenRecord(row as unknown as Record<string, unknown>)),
    "Profit by Material": profitByField(dataset.items, dataset.saleItems, "material").map((row) => flattenRecord(row as unknown as Record<string, unknown>)),
    "Profit by Item Type": profitByField(dataset.items, dataset.saleItems, "itemType").map((row) => flattenRecord(row as unknown as Record<string, unknown>)),
    Aging: agingRows(dataset.items).map((row) => flattenRecord(row as unknown as Record<string, unknown>)),
    COGS: saleItemRows.map((row) => ({ itemCode: row.itemCode, costBasisCents: row.costBasisCents, saleId: row.saleId })),
    "Ending Inventory": itemRows.filter((row) => ["draft", "active", "listed", "reserved"].includes(String(row.status)))
  });
};
