import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import XLSX from "xlsx";
import { buildSpreadsheetPlan, hashValue, summarizePlan } from "../../backend/src/import/spreadsheetPlanner";

const writeWorkbook = (name: string, sheets: Record<string, Array<Record<string, unknown>>>) => {
  const path = join(mkdtempSync(join(tmpdir(), "thriftops-import-")), name);
  const workbook = XLSX.utils.book_new();
  Object.entries(sheets).forEach(([sheetName, rows]) => {
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), sheetName);
  });
  XLSX.writeFile(workbook, path);
  return path;
};

const inventoryWorkbook = () => writeWorkbook("Inventory tracking 2026.xlsx", {
  Women: [
    { Brand: "", "what?": "", cost: "", "Market price": "" },
    { Brand: "360 cashmere", "what?": "beige cashmere sweater", size: "M", cost: "10.00", "Market price": "25.00" }
  ],
  "Women - Sold": [
    { Brand: "Gap", "what?": "sweater", cost: "4.00", Sold: "12.00", Event: "" },
    { Brand: "120 Lino", "what?": "linen shirt", cost: "8.00", Sold: "30.00", Shipping: "5.00", "Benefice net": "20.00", Event: new Date("2026-04-19T07:00:00.000Z") }
  ]
});

const accountingWorkbook = () => writeWorkbook("2nd hand sales accounting.xlsx", {
  "2026 - Revenus": [
    { DATE: new Date("2026-04-20T07:00:00.000Z"), ACCOUNT: "PayPal", DESCRIPTION: "Market payout", AMOUNT: "104.66" }
  ],
  "2026 - expenses": [
    { DATE: new Date("2026-04-21T07:00:00.000Z"), ACCOUNT: "Amex", DESCRIPTION: "dry cleaner", AMOUNT: "-14.95" }
  ],
  2025: [
    { DATE: "2025", DESCRIPTION: "summary", AMOUNT: "100.00" }
  ]
});

describe("spreadsheet import planner", () => {
  it("skips inventory subtotal rows and maps active inventory", () => {
    const [plan] = buildSpreadsheetPlan([inventoryWorkbook()]);
    const womenItems = plan.records.filter((record) => record.sheetName === "Women" && record.type === "item");
    expect(womenItems).toHaveLength(1);
    expect(womenItems[0].sourceRowNumber).toBe(3);
    expect(womenItems[0].data).toMatchObject({
      brand: "360 cashmere",
      itemType: "beige cashmere sweater",
      category: "women",
      status: "active",
      costBasisCents: 1000
    });
  });

  it("maps sold inventory rows with a sale amount and date to sale records", () => {
    const [plan] = buildSpreadsheetPlan([inventoryWorkbook()]);
    const soldItem = plan.records.find((record) => record.sheetName === "Women - Sold" && record.type === "item" && record.sourceRowNumber === 3);
    const sale = plan.records.find((record) => record.sheetName === "Women - Sold" && record.type === "sale" && record.sourceRowNumber === 3);
    expect(soldItem?.data).toMatchObject({ brand: "120 Lino", status: "sold", soldAt: new Date("2026-04-19T07:00:00.000Z") });
    expect(sale?.data).toMatchObject({ grossItemSubtotalCents: 3000, channel: "in_person_market" });
  });

  it("flags sold inventory rows without a reliable sale date when no event/date exists", () => {
    const [plan] = buildSpreadsheetPlan([inventoryWorkbook()]);
    const ambiguousItem = plan.records.find((record) => record.sheetName === "Women - Sold" && record.type === "item" && record.sourceRowNumber === 2);
    expect(ambiguousItem?.data.reviewFlags).toContain("missing_sale_date");
  });

  it("maps accounting revenue and expense rows", () => {
    const [plan] = buildSpreadsheetPlan([accountingWorkbook()]);
    const payment = plan.records.find((record) => record.sheetName === "2026 - Revenus" && record.type === "payment");
    const expense = plan.records.find((record) => record.sheetName === "2026 - expenses" && record.type === "expense");
    expect(payment?.data).toMatchObject({ source: "paypal", amountCents: 10466, importedFrom: "2nd hand sales accounting.xlsx" });
    expect(expense?.data).toMatchObject({ category: "cleaning_repair", vendor: "dry cleaner", amountCents: 1495 });
  });

  it("keeps source keys stable when non-identity values change and row hashes change", () => {
    const [plan] = buildSpreadsheetPlan([inventoryWorkbook()]);
    const record = plan.records.find((candidate) => candidate.sheetName === "Women" && candidate.sourceRowNumber === 3)!;
    const changedRow = { ...record.sourceRow, cost: 99 };
    expect(hashValue(record.sourceRow)).not.toBe(hashValue(changedRow));
    expect(record.sourceKey).toBe("inventory-tracking-2026-xlsx:women:r3:360-cashmere:beige-cashmere-sweater");
  });

  it("summarizes both workbooks", () => {
    const summary = summarizePlan(buildSpreadsheetPlan([inventoryWorkbook(), accountingWorkbook()]));
    expect(summary.item).toBe(3);
    expect(summary.sale).toBe(1);
    expect(summary.payment).toBe(1);
    expect(summary.expense).toBe(1);
    expect(summary.review).toBeGreaterThan(0);
  });
});
