import { describe, expect, it } from "vitest";
import { mapInventoryRow, reviewFlagsForInventoryRow } from "../services/importService";

describe("import mapping", () => {
  it("adds review flags for missing import values", () => {
    expect(reviewFlagsForInventoryRow({ Brand: "", cost: "", Sold: "" }, true)).toEqual(["missing_brand", "missing_cost", "missing_sale_price", "ambiguous_date_or_event"]);
  });

  it("maps active inventory sheets to active items", () => {
    const record = mapInventoryRow({ Brand: "Madewell", "what?": "Jeans", size: "28", cost: "6.50" }, "Women", 3);
    expect(record.proposed.itemCode).toBe("W-2026-000003");
    expect(record.proposed.status).toBe("active");
    expect(record.proposed.costBasisCents).toBe(650);
  });

  it("maps sold sheets to sold items with sale review flags", () => {
    const record = mapInventoryRow({ Brand: "Gap", "what?": "Sweater", cost: "4" }, "Kids - SOLD", 1);
    expect(record.proposed.status).toBe("sold");
    expect(record.reviewFlags).toContain("missing_sale_price");
  });
});
