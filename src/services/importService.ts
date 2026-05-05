import type { Category, ExpenseCategory, Item, PaymentSource } from "../types/domain";
import { centsFromDecimal } from "../lib/money";
import { generateItemCode } from "../lib/ids";
import { rowsFromSheet } from "../lib/excel";
import type * as XLSX from "xlsx";

export interface ImportPreviewRecord {
  id: string;
  type: "item" | "payment" | "expense" | "review";
  sheetName: string;
  sourceRow: Record<string, unknown>;
  proposed: Record<string, unknown>;
  reviewFlags: string[];
}

export interface ImportPreview {
  workbookName: string;
  detectedSheets: string[];
  rowCount: number;
  records: ImportPreviewRecord[];
}

const inventorySheets: Record<string, { category: Category; sold: boolean }> = {
  Women: { category: "women", sold: false },
  "Women - Sold": { category: "women", sold: true },
  Kids: { category: "kids", sold: false },
  "Kids - SOLD": { category: "kids", sold: true },
  "Home goods": { category: "home_goods", sold: false },
  "Home goods - Sold": { category: "home_goods", sold: true }
};

const getCell = (row: Record<string, unknown>, names: string[]): string => {
  const found = Object.entries(row).find(([key]) => names.some((name) => key.trim().toLowerCase() === name.toLowerCase()));
  return found ? String(found[1] ?? "").trim() : "";
};

export const reviewFlagsForInventoryRow = (row: Record<string, unknown>, sold: boolean): string[] => {
  const flags: string[] = [];
  if (!getCell(row, ["Brand"])) flags.push("missing_brand");
  if (!getCell(row, ["cost"])) flags.push("missing_cost");
  if (sold && !getCell(row, ["Sold", "Event / Market price"])) flags.push("missing_sale_price");
  if (sold && !getCell(row, ["date", "Event / Market price"])) flags.push("ambiguous_date_or_event");
  return flags;
};

export const mapInventoryRow = (row: Record<string, unknown>, sheetName: string, sequence: number): ImportPreviewRecord => {
  const config = inventorySheets[sheetName] ?? { category: "uncategorized" as Category, sold: false };
  const brand = getCell(row, ["Brand"]);
  const itemType = getCell(row, ["what?", "what", "item type"]);
  const soldPrice = centsFromDecimal(getCell(row, ["Sold", "Event / Market price"]));
  const reviewFlags = reviewFlagsForInventoryRow(row, config.sold);
  return {
    id: crypto.randomUUID(),
    type: "item",
    sheetName,
    sourceRow: row,
    reviewFlags,
    proposed: {
      itemCode: generateItemCode(config.category, sequence),
      category: config.category,
      status: config.sold ? "sold" : "active",
      brand,
      itemType,
      title: [brand, itemType].filter(Boolean).join(" ") || "Imported item",
      size: getCell(row, ["size"]),
      costBasisCents: centsFromDecimal(getCell(row, ["cost"])),
      currentListPriceCents: soldPrice || undefined,
      listingUrls: getCell(row, ["Link"]) ? [{ channel: "imported", url: getCell(row, ["Link"]) }] : [],
      importSource: { workbookType: "inventory", sheetName, sourceRow: row }
    }
  };
};

const revenueSheets = ["2026 - Revenus", "2025"];
const expenseSheets = ["2026 - expenses"];

const paymentSourceFromRow = (row: Record<string, unknown>): PaymentSource => {
  const text = JSON.stringify(row).toLowerCase();
  if (text.includes("venmo")) return "venmo";
  if (text.includes("paypal")) return "paypal";
  if (text.includes("noihsaf")) return "noihsaf";
  if (text.includes("cash")) return "cash";
  return "other";
};

const expenseCategoryFromRow = (row: Record<string, unknown>): ExpenseCategory => {
  const text = JSON.stringify(row).toLowerCase();
  if (text.includes("shipping")) return "shipping";
  if (text.includes("packag")) return "packaging";
  if (text.includes("booth") || text.includes("market")) return "market_booth_fee";
  if (text.includes("goodwill") || text.includes("inventory")) return "inventory_purchase";
  return "other";
};

export const buildImportPreview = (workbook: XLSX.WorkBook, workbookName: string): ImportPreview => {
  const records: ImportPreviewRecord[] = [];
  workbook.SheetNames.forEach((sheetName) => {
    const rows = rowsFromSheet(workbook, sheetName);
    rows.forEach((row, index) => {
      if (inventorySheets[sheetName]) {
        records.push(mapInventoryRow(row, sheetName, index + 1));
      } else if (revenueSheets.includes(sheetName)) {
        records.push({
          id: crypto.randomUUID(),
          type: "payment",
          sheetName,
          sourceRow: row,
          reviewFlags: [],
          proposed: {
            date: new Date().toISOString(),
            source: paymentSourceFromRow(row),
            amountCents: centsFromDecimal(getCell(row, ["amount", "total", "Sold", "Revenue"])),
            note: JSON.stringify(row),
            importedFrom: workbookName
          }
        });
      } else if (expenseSheets.includes(sheetName)) {
        records.push({
          id: crypto.randomUUID(),
          type: "expense",
          sheetName,
          sourceRow: row,
          reviewFlags: [],
          proposed: {
            date: new Date().toISOString(),
            category: expenseCategoryFromRow(row),
            vendor: getCell(row, ["vendor", "Vendor", "store"]) || "Imported",
            amountCents: centsFromDecimal(getCell(row, ["amount", "total", "cost"])),
            paymentMethod: "",
            taxDeductible: true,
            notes: JSON.stringify(row)
          }
        });
      } else if (sheetName !== "info") {
        records.push({ id: crypto.randomUUID(), type: "review", sheetName, sourceRow: row, proposed: {}, reviewFlags: ["unknown_sheet"] });
      }
    });
  });
  return { workbookName, detectedSheets: workbook.SheetNames, rowCount: records.length, records };
};

export const itemInputFromImportRecord = (record: ImportPreviewRecord): Partial<Item> => record.proposed as Partial<Item>;
