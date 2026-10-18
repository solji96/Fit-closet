import { describe, expect, it } from "vitest";
import type { CalendarEvent, UserPreferences, WardrobeItem } from "../data/types";
import {
  editorialComment,
  moreFormalOutfit,
  recommendOutfit,
  rerollCategory,
  shiftMoodOutfit,
  toRecommendation,
  usesOnlyOwnedItems,
  weatherLookComment,
} from "./recommend";

const preferences: UserPreferences = {
  ageGroup: "20s30s",
  stylePreferences: ["minimal_classic"],
  preferredColors: [],
  avoidStyles: [],
};

const event: CalendarEvent = {
  id: "e1",
  date: "2026-10-13",
  time: "18:00",
  tpo: "casual",
  createdAt: "",
  updatedAt: "",
};

function item(partial: Partial<WardrobeItem> & Pick<WardrobeItem, "id" | "category" | "name">): WardrobeItem {
  return {
    source: "checklist",
    createdAt: "",
    updatedAt: "",
    status: "active",
    ...partial,
  };
}

describe("recommendOutfit", () => {
  it("only uses checked wardrobe items", () => {
    const wardrobe = [
      item({ id: "t1", category: "top", name: "셔츠", catalogId: "shirt" }),
      item({ id: "b1", category: "bottom", name: "슬랙스", catalogId: "slacks" }),
    ];
    const result = recommendOutfit({ event, wardrobe, preferences });
    expect(result.primary).not.toBeNull();
    const rec = toRecommendation(event.id, result.primary!, "primary", result.reason);
    expect(usesOnlyOwnedItems(rec, wardrobe)).toBe(true);
    expect(rec.items.some((entry) => entry.name === "청바지")).toBe(false);
  });

  it("includes boutique shoe metadata in the recommended combination", () => {
    const wardrobe = [
      item({ id: "t1", category: "top", name: "상의 · 화이트", catalogId: "palette-top:화이트", color: "화이트" }),
      item({ id: "b1", category: "bottom", name: "하의 · 네이비", catalogId: "palette-bottom:네이비", color: "네이비" }),
      item({
        id: "s1",
        category: "shoes",
        name: "클래식 로퍼",
        catalogId: "loafers",
        itemType: "loafer",
        style: "classic",
        material: "레더",
        color: "브라운",
      }),
    ];
    const result = recommendOutfit({ event, wardrobe, preferences });
    const shoe = result.primary?.items.find((entry) => entry.category === "shoes");
    expect(shoe?.itemType).toBe("loafer");
    expect(shoe?.style).toBe("classic");
    expect(shoe?.material).toBe("레더");
  });

  it("treats a skirt as a lower piece", () => {
    const wardrobe = [
      item({ id: "t1", category: "top", name: "터틀넥", catalogId: "top-turtleneck", itemType: "turtleneck" }),
      item({ id: "k1", category: "skirt", name: "미디 스커트", catalogId: "skirt-midi", itemType: "midi-skirt" }),
    ];
    const result = recommendOutfit({ event, wardrobe, preferences });
    expect(result.primary?.items.some((entry) => entry.category === "skirt")).toBe(true);
    expect(result.incomplete).toBe(false);
  });

  it("hides complement when core outfit is complete", () => {
    const wardrobe = [
      item({ id: "t1", category: "top", name: "셔츠", catalogId: "shirt" }),
      item({ id: "b1", category: "bottom", name: "슬랙스", catalogId: "slacks" }),
      item({ id: "s1", category: "shoes", name: "로퍼", catalogId: "loafers" }),
    ];
    const result = recommendOutfit({ event, wardrobe, preferences });
    expect(result.completeWithoutPurchase).toBe(true);
    expect(result.complement).toBeNull();
  });

  it("excludes archived items from combinations", () => {
    const wardrobe = [
      item({ id: "t1", category: "top", name: "셔츠", catalogId: "shirt" }),
      item({ id: "t2", category: "top", name: "후디", catalogId: "top-hoodie-cotton", status: "archived", itemType: "hoodie-cotton" }),
      item({ id: "b1", category: "bottom", name: "슬랙스", catalogId: "slacks" }),
    ];
    const result = recommendOutfit({ event, wardrobe, preferences });
    expect(result.primary?.items.some((entry) => entry.id === "t2")).toBe(false);
  });

  it("prefers owned coats in cold weather without inventing items", () => {
    const wardrobe = [
      item({ id: "t1", category: "top", name: "티셔츠", catalogId: "tee", itemType: "standard-tee", formality: 2 }),
      item({ id: "b1", category: "bottom", name: "슬랙스", catalogId: "slacks", itemType: "tapered-slacks" }),
      item({ id: "o1", category: "outer", name: "롱 코트", catalogId: "coat-long", itemType: "long-coat", formality: 5 }),
    ];
    const result = recommendOutfit({
      event,
      wardrobe,
      preferences,
      weather: {
        temperatureCelsius: 6,
        conditionCode: 3,
        fetchedAt: "2026-10-14T06:00:00.000Z",
        source: "manual",
        locationLabel: "서울",
      },
    });
    expect(result.primary?.items.some((entry) => entry.id === "o1")).toBe(true);
    expect(result.weatherNote).toMatch(/6°C/);
    expect(result.reason).toMatch(/6°C/);
    expect(result.primary?.items.every((entry) => wardrobe.some((item) => item.id === entry.id))).toBe(true);
  });

  it("writes an editorial comment from owned pieces only", () => {
    const items = [
      item({ id: "t1", category: "top", name: "니트 베스트", itemType: "knit-vest", style: "classic" }),
      item({ id: "b1", category: "bottom", name: "와이드 슬랙스", itemType: "wide-slacks", fit: "wide" }),
    ];
    expect(editorialComment(items)).toMatch(/실루엣/);
  });

  it("mentions diurnal range only when min and max exist", () => {
    const withRange = weatherLookComment({
      temperatureCelsius: 12,
      temperatureMinCelsius: 6,
      temperatureMaxCelsius: 18,
      fetchedAt: "2026-10-14T06:00:00.000Z",
      source: "manual",
    });
    expect(withRange).toMatch(/일교차/);
    const withoutRange = weatherLookComment({
      temperatureCelsius: 12,
      fetchedAt: "2026-10-14T06:00:00.000Z",
      source: "manual",
    });
    expect(withoutRange).not.toMatch(/일교차/);
  });

  it("does not invent a hoodie when it is not owned", () => {
    const wardrobe = [
      item({ id: "t1", category: "top", name: "셔츠", catalogId: "shirt", itemType: "oversize-shirt" }),
      item({ id: "b1", category: "bottom", name: "슬랙스", catalogId: "slacks" }),
    ];
    const result = recommendOutfit({
      event,
      wardrobe,
      preferences,
      weather: {
        temperatureCelsius: 8,
        fetchedAt: "2026-10-14T06:00:00.000Z",
        source: "manual",
      },
    });
    expect(result.primary?.items.some((entry) => entry.itemType?.includes("hoodie"))).toBe(false);
  });

  it("suggests at most one demo complement when shoes are missing", () => {
    const wardrobe = [
      item({ id: "t1", category: "top", name: "셔츠", catalogId: "shirt" }),
      item({ id: "b1", category: "bottom", name: "슬랙스", catalogId: "slacks" }),
    ];
    const result = recommendOutfit({ event, wardrobe, preferences });
    expect(result.complement?.category).toBe("shoes");
    expect(result.complement?.isDemo).toBe(true);
    expect(result.complement?.reason).not.toMatch(/없어|부족/);
  });
});

describe("rerollCategory", () => {
  it("explains when no other top exists", () => {
    const wardrobe = [
      item({ id: "t1", category: "top", name: "셔츠", catalogId: "shirt" }),
      item({ id: "b1", category: "bottom", name: "슬랙스", catalogId: "slacks" }),
    ];
    const base = recommendOutfit({ event, wardrobe, preferences });
    const current = toRecommendation(event.id, base.primary!, "primary", base.reason, { mood: base.mood });
    const { combination, message } = rerollCategory({ event, wardrobe, preferences }, current, "top");
    expect(combination).toBeNull();
    expect(message).toMatch(/다른 조합을 구성하기 어렵습니다/);
  });

  it("changes only the top", () => {
    const wardrobe = [
      item({ id: "t1", category: "top", name: "셔츠", catalogId: "shirt" }),
      item({ id: "t2", category: "top", name: "니트", catalogId: "knit" }),
      item({ id: "b1", category: "bottom", name: "슬랙스", catalogId: "slacks" }),
    ];
    const base = recommendOutfit({ event, wardrobe, preferences });
    const current = toRecommendation(event.id, base.primary!, "primary", base.reason, { mood: base.mood });
    const { combination } = rerollCategory({ event, wardrobe, preferences }, current, "top");
    expect(combination).not.toBeNull();
    const keptBottom = current.items.find((entry) => entry.category === "bottom")?.itemId;
    expect(combination!.items.find((entry) => entry.category === "bottom")?.id).toBe(keptBottom);
    expect(combination!.items.find((entry) => entry.category === "top")?.id).not.toBe(
      current.items.find((entry) => entry.category === "top")?.itemId,
    );
  });
});

describe("quick edits", () => {
  const wardrobe = [
    item({ id: "t1", category: "top", name: "셔츠", catalogId: "shirt", formality: 4, moods: ["neat", "formal"] }),
    item({ id: "t2", category: "top", name: "티셔츠", catalogId: "tee", formality: 2, moods: ["comfortable", "trendy"] }),
    item({ id: "b1", category: "bottom", name: "슬랙스", catalogId: "slacks", formality: 4, moods: ["neat", "formal"] }),
    item({ id: "b2", category: "bottom", name: "청바지", catalogId: "jeans", formality: 2, moods: ["comfortable", "trendy"] }),
  ];

  it("moreFormalOutfit prefers higher formality pieces", () => {
    const casualPref: UserPreferences = { ...preferences, stylePreferences: ["natural_comfort"] };
    const base = recommendOutfit({ event, wardrobe, preferences: casualPref, mood: "natural_comfort" });
    const current = toRecommendation(event.id, base.primary!, "primary", base.reason, { mood: "natural_comfort" });
    const shifted = moreFormalOutfit({ event, wardrobe, preferences: casualPref }, current);
    expect(shifted.ok).toBe(true);
    if (!shifted.ok) return;
    const avg =
      shifted.combination.items.reduce((sum, entry) => sum + (entry.formality ?? 3), 0) /
      shifted.combination.items.length;
    const before =
      current.items.reduce((sum, entry) => {
        const full = wardrobe.find((item) => item.id === entry.itemId);
        return sum + (full?.formality ?? 3);
      }, 0) / current.items.length;
    expect(avg).toBeGreaterThanOrEqual(before);
    expect(shifted.combination.items.map((entry) => entry.id).sort().join()).not.toBe(
      current.items.map((entry) => entry.itemId).sort().join(),
    );
  });

  it("shiftMoodOutfit changes mood without inventing items", () => {
    const base = recommendOutfit({ event, wardrobe, preferences, mood: "minimal_classic" });
    const current = toRecommendation(event.id, base.primary!, "primary", base.reason, { mood: "minimal_classic" });
    const shifted = shiftMoodOutfit({ event, wardrobe, preferences }, current);
    expect(shifted.ok).toBe(true);
    if (!shifted.ok) return;
    expect(shifted.mood).not.toBe("minimal_classic");
    expect(usesOnlyOwnedItems(toRecommendation(event.id, shifted.combination, "primary", shifted.reason), wardrobe)).toBe(
      true,
    );
  });
});
