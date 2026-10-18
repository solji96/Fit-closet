import { describe, expect, it } from "vitest";
import { COMFORTABLE_CASUAL_LABEL } from "../domain/tags";
import {
  catalogByCategory,
  catalogFieldsForWardrobe,
  colorsFromChecklistIds,
  EMPTY_FILTER,
  matchesCatalogFilter,
  nearestPaletteColor,
  normalizeChecklistIds,
  checklistColorMap,
  paletteCatalogId,
  parsePaletteCatalogId,
  SKIP_IDS,
  STYLE_OPTIONS,
} from "./catalog";

describe("wardrobe palette ids", () => {
  it("encodes and parses top and bottom colors", () => {
    const id = paletteCatalogId("top", "네이비");
    expect(parsePaletteCatalogId(id)).toEqual({ category: "top", color: "네이비" });
  });

  it("converts legacy catalog checklist ids into refined types", () => {
    const next = normalizeChecklistIds(["shirt", "jeans", "jacket", "bag", "accessory", "skirt"]);
    expect(next).toContain("top-shirt-oversize");
    expect(next).toContain("bottom-denim-straight");
    expect(next).toContain("skirt-midi");
    expect(normalizeChecklistIds(["shoes-maryjane-heel", "shoes-ballerina-heel"])).toEqual(["shoes-ballerina-heel"]);
    expect(normalizeChecklistIds(["accessory-earrings-pearl"])).toEqual(["accessory-earrings-gold"]);
    expect(
      checklistColorMap([{ source: "checklist", catalogId: "accessory-earrings-pearl", color: "진주" }]),
    ).toEqual({ "accessory-earrings-gold": ["진주 세팅"] });
    expect(
      checklistColorMap([
        { source: "checklist", catalogId: "bottom-denim-straight", color: "블랙" },
        { source: "checklist", catalogId: "bottom-denim-straight", color: "네이비" },
        { source: "checklist", catalogId: "bottom-denim-straight", color: "블랙" },
      ]),
    ).toEqual({ "bottom-denim-straight": ["블랙", "네이비"] });
    expect(next).toContain("jacket-tailored");
    expect(next).toContain("bag-shoulder");
    expect(next).toContain("accessory-earrings-gold");
    expect(next.some((id) => id === "shirt" || id === "jacket" || id === "bag" || id === "skirt")).toBe(false);
  });

  it("collects unique palette and catalog colors", () => {
    const ids = [paletteCatalogId("top", "블랙"), paletteCatalogId("bottom", "블랙")];
    expect(colorsFromChecklistIds(ids)).toEqual(["블랙"]);
    expect(colorsFromChecklistIds(["loafers"])).toContain(nearestPaletteColor("브라운"));
  });

  it("keeps shoe metadata for recommendations", () => {
    const loafer = catalogByCategory("shoes").find((item) => item.id === "loafers");
    expect(loafer?.englishName).toBe("PENNY LOAFER");
    expect(catalogFieldsForWardrobe(loafer!).itemType).toBe("loafer");
    expect(catalogFieldsForWardrobe(loafer!).style).toBe("classic");
    expect(catalogFieldsForWardrobe(loafer!).material).toBe("레더");
  });

  it("keeps skip when no bag items are selected", () => {
    const next = normalizeChecklistIds([SKIP_IDS.bag, "loafers"]);
    expect(next).toContain("loafers");
    expect(next).toContain(SKIP_IDS.bag);
  });

  it("drops skip when a bag item is present", () => {
    const next = normalizeChecklistIds(["bag-tote", SKIP_IDS.bag]);
    expect(next).toContain("bag-tote");
    expect(next).not.toContain(SKIP_IDS.bag);
  });

  it("includes refined outer, bag, and accessory types", () => {
    const outers = catalogByCategory("outer").map((item) => item.id);
    expect(outers).toEqual(
      expect.arrayContaining([
        "jacket-leather",
        "jacket-denim",
        "jacket-tailored",
        "jacket-bomber",
        "cardigan-short",
        "cardigan-long",
        "cardigan-boxy",
        "coat-short",
        "coat-long",
        "coat-boxy",
        "coat-trench",
        "puffer-short",
        "down-long",
        "mustang-shearling",
      ]),
    );
    expect(catalogByCategory("bag").map((item) => item.itemType)).toEqual(
      expect.arrayContaining(["tote", "shoulder-bag", "crossbody", "backpack", "clutch", "mini-bag"]),
    );
    expect(catalogByCategory("accessory").map((item) => item.itemType)).toEqual(
      expect.arrayContaining([
        "chain-necklace",
        "pearl-necklace",
        "orbital-pearl",
        "pendant-necklace",
        "leather-belt",
        "chain-belt",
        "long-scarf",
        "petit-scarf",
      ]),
    );
    expect(catalogByCategory("top").map((item) => item.itemType)).toEqual(
      expect.arrayContaining([
        "standard-tee",
        "waffle-tee",
        "waffle-long-sleeve",
        "terry-hoodie",
        "crop-tee",
        "silk-blouse",
        "oxford-check",
        "paisley-blouse",
        "flower-blouse",
        "turtleneck",
        "knit-vest",
        "hoodie-cotton",
        "sweatshirt",
      ]),
    );
    expect(catalogByCategory("bottom").map((item) => item.itemType)).toEqual(
      expect.arrayContaining(["jogger", "sweat-pants", "pintuck-slacks", "straight-slacks", "light-denim", "black-denim", "check-denim", "camo-denim", "washed-denim", "pattern-cotton"]),
    );
    expect(catalogByCategory("skirt").map((item) => item.itemType)).toEqual(
      expect.arrayContaining(["long-skirt", "midi-skirt", "mini-skirt", "pleated-skirt", "suede-skirt"]),
    );
    expect(catalogByCategory("shoes").map((item) => item.itemType)).toEqual(
      expect.arrayContaining(["loafer", "chelsea", "runner", "canvas-sneaker", "long-boot", "ballerina-heel", "satin-ballet", "tabi"]),
    );
  });

  it("shows natural_comfort as 컴포터블 캐주얼 without using slang identifiers as labels", () => {
    const mood = STYLE_OPTIONS.find((option) => option.id === "natural_comfort");
    expect(mood?.id).toBe("natural_comfort");
    expect(mood?.chipLabel).toBe(COMFORTABLE_CASUAL_LABEL);
    expect(mood?.label).toContain("Comfortable Casual");
  });

  it("filters outer length and family together", () => {
    const longCoat = catalogByCategory("outer").find((item) => item.id === "coat-long");
    const shortPuffer = catalogByCategory("outer").find((item) => item.id === "puffer-short");
    expect(matchesCatalogFilter(longCoat!, EMPTY_FILTER)).toBe(true);
    expect(matchesCatalogFilter(longCoat!, { lengths: ["long"], families: ["coat"], colorTones: [] })).toBe(true);
    expect(matchesCatalogFilter(shortPuffer!, { lengths: ["long"], families: [], colorTones: [] })).toBe(false);
  });
});
