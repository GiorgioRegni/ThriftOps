import { describe, expect, it } from "vitest";
import { generateItemCode, nextSequenceFromCodes } from "../lib/ids";

describe("item IDs", () => {
  it("generates category/year sequence IDs", () => {
    expect(generateItemCode("women", 1, new Date("2026-04-01"))).toBe("W-2026-000001");
    expect(generateItemCode("kids", 42, new Date("2026-04-01"))).toBe("K-2026-000042");
  });

  it("finds the next sequence for a category and year", () => {
    expect(nextSequenceFromCodes(["W-2026-000001", "W-2026-000007", "K-2026-000099"], "women", new Date("2026-04-01"))).toBe(8);
  });
});
