import { describe, expect, it } from "vitest";
import { CATEGORY_ACCORDION_DEFAULT_OPEN, isCategoryPanelVisible } from "./CategoryAccordion";

describe("category accordion", () => {
  it("starts collapsed so option chips are not on the first screen", () => {
    expect(CATEGORY_ACCORDION_DEFAULT_OPEN).toBe(false);
    expect(isCategoryPanelVisible(false, false)).toBe(false);
  });

  it("opens a matching section when search forces it", () => {
    expect(isCategoryPanelVisible(false, true)).toBe(true);
  });
});
