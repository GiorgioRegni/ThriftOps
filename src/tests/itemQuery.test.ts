import { describe, expect, it } from "vitest";
import { hasItemPageQuery, itemOrderByFromSort, itemWhereFromPageQuery, parseItemPageQuery } from "../../backend/src/itemQuery";

describe("item pagination query helpers", () => {
  it("detects paginated item requests", () => {
    expect(hasItemPageQuery({})).toBe(false);
    expect(hasItemPageQuery({ page: "1" })).toBe(true);
    expect(hasItemPageQuery({ search: "linen" })).toBe(true);
  });

  it("clamps invalid query values to inventory defaults", () => {
    expect(parseItemPageQuery({ page: "-2", pageSize: "500", status: "archived", category: "shoes", sort: "random" })).toEqual({
      page: 1,
      pageSize: 24,
      search: "",
      status: "",
      category: "",
      sort: "newest"
    });
  });

  it("builds exact filters and case-insensitive search", () => {
    expect(itemWhereFromPageQuery("org-1", parseItemPageQuery({ search: " linen ", status: "active", category: "women" }))).toEqual({
      orgId: "org-1",
      status: "active",
      category: "women",
      OR: ["itemCode", "brand", "title", "itemType", "size", "material", "sourceVendor"].map((field) => ({
        [field]: { contains: "linen", mode: "insensitive" }
      }))
    });
  });

  it("maps inventory sort modes to stable Prisma order clauses", () => {
    expect(itemOrderByFromSort("newest")).toEqual([{ createdAt: "desc" }, { id: "desc" }]);
    expect(itemOrderByFromSort("oldest")).toEqual([{ acquiredAt: "asc" }, { id: "asc" }]);
    expect(itemOrderByFromSort("highest_cost")).toEqual([{ costBasisCents: "desc" }, { id: "desc" }]);
    expect(itemOrderByFromSort("highest_list_price")).toEqual([{ currentListPriceCents: { sort: "desc", nulls: "last" } }, { id: "desc" }]);
    expect(itemOrderByFromSort("stale_first")).toEqual([{ acquiredAt: "asc" }, { id: "asc" }]);
  });
});
