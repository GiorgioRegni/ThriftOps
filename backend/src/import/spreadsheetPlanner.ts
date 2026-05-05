import { createHash } from "node:crypto";
import { basename } from "node:path";
import XLSX from "xlsx";
import { daysHeld, netProfitForSaleItem } from "../../../src/lib/calculations.ts";
import { centsFromDecimal } from "../../../src/lib/money.ts";

export type ImportPlanRecordType = "item" | "sale" | "payment" | "expense" | "review";
export type ImportPlanStatus = "ready" | "review";

export interface ImportPlanRecord {
  workbookName: string;
  sheetName: string;
  sourceRowNumber: number;
  sourceKey: string;
  rowHash: string;
  type: ImportPlanRecordType;
  status: ImportPlanStatus;
  reviewFlags: string[];
  sourceRow: Record<string, unknown>;
  data: Record<string, unknown>;
  relatedSourceKeys?: string[];
}

export interface ImportWorkbookPlan {
  workbookPath: string;
  workbookName: string;
  fileHash: string;
  records: ImportPlanRecord[];
}

const inventorySheets: Record<string, { category: string; sold: boolean }> = {
  Women: { category: "women", sold: false },
  "Women - Sold": { category: "women", sold: true },
  Kids: { category: "kids", sold: false },
  "Kids - SOLD": { category: "kids", sold: true },
  "Home goods": { category: "home_goods", sold: false },
  "Home goods - Sold": { category: "home_goods", sold: true }
};

const revenueSheets = new Set(["2026 - Revenus"]);
const expenseSheets = new Set(["2026 - expenses"]);

const normalizeText = (value: unknown): string => String(value ?? "").trim();
const normalizeLower = (value: unknown): string => normalizeText(value).toLowerCase();
const hasValue = (value: unknown): boolean => normalizeText(value) !== "";
const slug = (value: unknown): string => normalizeLower(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "blank";
const moneyValue = (value: unknown): string | number | null | undefined => typeof value === "string" || typeof value === "number" || value == null ? value : normalizeText(value);

const stableJson = (value: unknown): string => {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, val]) => `${JSON.stringify(key)}:${stableJson(val)}`).join(",")}}`;
  }
  return JSON.stringify(value ?? "");
};

export const hashValue = (value: unknown): string => createHash("sha256").update(stableJson(value)).digest("hex");
export const shortHash = (value: unknown): string => hashValue(value).slice(0, 16);

export const readWorkbookFile = (workbookPath: string): ImportWorkbookPlan => {
  const workbook = XLSX.readFile(workbookPath, { cellDates: true });
  const workbookName = basename(workbookPath);
  const records = workbook.SheetNames.flatMap((sheetName) => planSheet(workbook, workbookName, sheetName));
  return {
    workbookPath,
    workbookName,
    fileHash: hashValue({ workbookName, records: workbook.SheetNames.map((sheetName) => ({ sheetName, rows: rowsFromSheet(workbook, sheetName) })) }),
    records
  };
};

const rowsFromSheet = (workbook: XLSX.WorkBook, sheetName: string): Array<{ rowNumber: number; row: Record<string, unknown> }> => {
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], { defval: "", raw: true });
  return rows.map((row, index) => ({ rowNumber: index + 2, row })).filter(({ row }) => Object.values(row).some(hasValue));
};

const planSheet = (workbook: XLSX.WorkBook, workbookName: string, sheetName: string): ImportPlanRecord[] => {
  const rows = rowsFromSheet(workbook, sheetName);
  if (inventorySheets[sheetName]) return planInventoryRows(workbookName, sheetName, rows);
  if (revenueSheets.has(sheetName)) return planPaymentRows(workbookName, sheetName, rows);
  if (expenseSheets.has(sheetName)) return planExpenseRows(workbookName, sheetName, rows);
  if (sheetName === "2025") return rows.map(({ rowNumber, row }) => reviewRecord(workbookName, sheetName, rowNumber, row, ["summary_sheet"]));
  return [];
};

const getCell = (row: Record<string, unknown>, names: string[]): unknown => {
  const found = Object.entries(row).find(([key]) => names.some((name) => key.trim().toLowerCase() === name.toLowerCase()));
  return found?.[1] ?? "";
};

const parseDate = (value: unknown): Date | undefined => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) return new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
  }
  const text = normalizeText(value);
  if (!text) return undefined;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const sourceKeyFor = (workbookName: string, sheetName: string, rowNumber: number, row: Record<string, unknown>): string =>
  [
    slug(workbookName),
    slug(sheetName),
    `r${rowNumber}`,
    slug(getCell(row, ["Brand", "DESCRIPTION", "COGS"])),
    slug(getCell(row, ["what?", "ACCOUNT", "Goodwill receipts / Amex list"]))
  ].join(":");

const baseRecord = (workbookName: string, sheetName: string, rowNumber: number, row: Record<string, unknown>, type: ImportPlanRecordType, reviewFlags: string[], data: Record<string, unknown>): ImportPlanRecord => ({
  workbookName,
  sheetName,
  sourceRowNumber: rowNumber,
  sourceKey: sourceKeyFor(workbookName, sheetName, rowNumber, row),
  rowHash: hashValue(row),
  type,
  status: reviewFlags.length ? "review" : "ready",
  reviewFlags,
  sourceRow: row,
  data
});

const reviewRecord = (workbookName: string, sheetName: string, rowNumber: number, row: Record<string, unknown>, reviewFlags: string[]): ImportPlanRecord =>
  baseRecord(workbookName, sheetName, rowNumber, row, "review", reviewFlags, { note: JSON.stringify(row) });

const planInventoryRows = (workbookName: string, sheetName: string, rows: Array<{ rowNumber: number; row: Record<string, unknown> }>): ImportPlanRecord[] => {
  const config = inventorySheets[sheetName];
  const records: ImportPlanRecord[] = [];
  for (const { rowNumber, row } of rows) {
    const brand = normalizeText(getCell(row, ["Brand"]));
    const itemType = normalizeText(getCell(row, ["what?", "what", "item type"]));
    if (!brand && !itemType) continue;
    const soldAmountCents = centsFromDecimal(moneyValue(getCell(row, ["Sold"])));
    const costBasisCents = centsFromDecimal(moneyValue(getCell(row, ["cost"])));
    const shippingCents = centsFromDecimal(moneyValue(getCell(row, ["Shipping"])));
    const netCents = centsFromDecimal(moneyValue(getCell(row, ["Benefice net"])));
    const marketOrEvent = getCell(row, ["Event", "Market price"]);
    const soldAt = parseDate(marketOrEvent);
    const linkValue = normalizeText(getCell(row, ["Link"]));
    const reviewFlags = [
      ...(!brand ? ["missing_brand"] : []),
      ...(costBasisCents === 0 ? ["missing_cost"] : []),
      ...(config.sold && soldAmountCents === 0 ? ["missing_sale_price"] : []),
      ...(config.sold && soldAmountCents !== 0 && !soldAt ? ["missing_sale_date"] : [])
    ];
    const acquiredAt = new Date("2026-01-01T00:00:00.000Z");
    const itemData = {
      itemCode: undefined,
      category: config.category,
      status: config.sold ? "sold" : "active",
      brand,
      itemType,
      title: [brand, itemType].filter(Boolean).join(" ") || "Imported item",
      description: "",
      size: normalizeText(getCell(row, ["size"])),
      material: "",
      color: "",
      condition: "unknown",
      styleTags: [],
      seasonTags: [],
      measurements: { unit: "in" },
      costBasisCents,
      acquiredAt,
      listedAt: undefined,
      soldAt: soldAt ?? undefined,
      sourceVendor: "Imported spreadsheet",
      sourceLocation: "",
      storageLocation: "",
      photos: [],
      listingUrls: linkValue ? [{ channel: "imported", url: linkValue, listedAt: acquiredAt.toISOString(), status: "active" }] : [],
      currentListPriceCents: config.sold ? undefined : centsFromDecimal(moneyValue(getCell(row, ["Market price"]))),
      originalListPriceCents: undefined,
      notes: "",
      importSource: { workbookName, sheetName, rowNumber, row },
      reviewFlags
    };
    const itemRecord = baseRecord(workbookName, sheetName, rowNumber, row, "item", reviewFlags.filter((flag) => flag !== "missing_sale_date" && flag !== "missing_sale_price"), itemData);
    records.push(itemRecord);
    if (config.sold && soldAmountCents !== 0 && soldAt) {
      const saleSourceKey = `${itemRecord.sourceKey}:sale`;
      const saleData = {
        soldAt,
        channel: channelFromEvent(marketOrEvent),
        paymentMethod: "other",
        grossItemSubtotalCents: soldAmountCents,
        discountCents: 0,
        shippingChargedCents: shippingCents,
        salesTaxCollectedCents: 0,
        marketplaceCollectedTax: false,
        platformFeeCents: 0,
        paymentFeeCents: 0,
        actualShippingCostCents: 0,
        packagingCostCents: 0,
        otherCostCents: Math.max(0, soldAmountCents + shippingCents - costBasisCents - netCents),
        totalReceivedCents: soldAmountCents + shippingCents,
        payoutStatus: "unmatched",
        paymentIds: [],
        notes: `Imported from ${sheetName} row ${rowNumber}`,
        proofPhotos: [],
        saleItem: {
          allocatedSalePriceCents: soldAmountCents,
          allocatedDiscountCents: 0,
          costBasisCents,
          allocatedPlatformFeeCents: 0,
          allocatedPaymentFeeCents: 0,
          allocatedShippingCostCents: 0,
          allocatedPackagingCostCents: 0,
          allocatedEventFeeCents: 0,
          netProfitCents: netProfitForSaleItem({
            allocatedSalePriceCents: soldAmountCents,
            allocatedDiscountCents: 0,
            costBasisCents,
            allocatedPlatformFeeCents: 0,
            allocatedPaymentFeeCents: 0,
            allocatedShippingCostCents: 0,
            allocatedPackagingCostCents: 0,
            allocatedEventFeeCents: 0
          }),
          daysHeld: daysHeld(soldAt.toISOString(), acquiredAt.toISOString())
        }
      };
      records.push({
        ...baseRecord(workbookName, sheetName, rowNumber, row, "sale", [], saleData),
        sourceKey: saleSourceKey,
        relatedSourceKeys: [itemRecord.sourceKey]
      });
    }
  }
  return records;
};

const channelFromEvent = (value: unknown): string => {
  const text = normalizeLower(value);
  if (text.includes("noihsaf")) return "noihsaf";
  if (text.includes("cash")) return "cash";
  if (text.includes("stc") || text.includes("small talk")) return "other";
  if (text.includes("market") || text.includes("picnic") || text.includes("solano") || parseDate(value)) return "in_person_market";
  return "other";
};

const paymentSourceFromAccount = (value: unknown): string => {
  const text = normalizeLower(value);
  if (text.includes("venmo")) return "venmo";
  if (text.includes("paypal")) return "paypal";
  if (text.includes("noihsaf")) return "noihsaf";
  if (text.includes("cash")) return "cash";
  if (text.includes("stripe")) return "stripe";
  return "other";
};

const expenseCategoryFromRow = (row: Record<string, unknown>): string => {
  const text = stableJson(row).toLowerCase();
  if (text.includes("goodwill") || normalizeLower(row.TYPE) === "cogs") return "inventory_purchase";
  if (text.includes("shipping") || text.includes("pirate")) return "shipping";
  if (text.includes("clean")) return "cleaning_repair";
  if (text.includes("booth") || text.includes("market")) return "market_booth_fee";
  return "other";
};

const planPaymentRows = (workbookName: string, sheetName: string, rows: Array<{ rowNumber: number; row: Record<string, unknown> }>): ImportPlanRecord[] =>
  rows.flatMap(({ rowNumber, row }) => {
    const date = parseDate(row.DATE);
    const amountCents = centsFromDecimal(moneyValue(row.AMOUNT));
    if (!date || amountCents === 0) return hasValue(row.DATE) ? [reviewRecord(workbookName, sheetName, rowNumber, row, ["invalid_payment_row"])] : [];
    return [baseRecord(workbookName, sheetName, rowNumber, row, "payment", [], {
      date,
      source: paymentSourceFromAccount(row.ACCOUNT),
      amountCents,
      externalTransactionId: undefined,
      counterparty: normalizeText(row.ACCOUNT),
      note: normalizeText(row.DESCRIPTION),
      matchedSaleIds: [],
      status: "unmatched",
      importedFrom: workbookName
    })];
  });

const planExpenseRows = (workbookName: string, sheetName: string, rows: Array<{ rowNumber: number; row: Record<string, unknown> }>): ImportPlanRecord[] =>
  rows.flatMap(({ rowNumber, row }) => {
    const date = parseDate(row.DATE);
    const amountCents = Math.abs(centsFromDecimal(moneyValue(row.AMOUNT)));
    if (!date || amountCents === 0) return hasValue(row.DATE) ? [reviewRecord(workbookName, sheetName, rowNumber, row, ["invalid_expense_row"])] : [];
    return [baseRecord(workbookName, sheetName, rowNumber, row, "expense", [], {
      date,
      category: expenseCategoryFromRow(row),
      vendor: normalizeText(row.DESCRIPTION) || "Imported",
      amountCents,
      paymentMethod: normalizeText(row.ACCOUNT),
      receiptPhotos: [],
      taxDeductible: true,
      notes: normalizeText(row["receipt?"]) ? `Receipt: ${normalizeText(row["receipt?"])}` : "",
      linkedItemId: undefined,
      linkedSaleId: undefined,
      linkedPurchaseId: undefined
    })];
  });

export const buildSpreadsheetPlan = (workbookPaths: string[]): ImportWorkbookPlan[] => workbookPaths.map(readWorkbookFile);

export const summarizePlan = (plans: ImportWorkbookPlan[]) => plans.flatMap((plan) => plan.records).reduce<Record<string, number>>((acc, record) => {
  acc.total = (acc.total || 0) + 1;
  acc[record.type] = (acc[record.type] || 0) + 1;
  if (record.status === "review") acc.review = (acc.review || 0) + 1;
  return acc;
}, {});
