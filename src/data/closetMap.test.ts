import { describe, expect, it } from "vitest";
import { fromClosetRecord, toClosetPayload } from "./closetMap";
import { defaultState } from "./storage";
import type { AppState } from "./types";

function sampleState(): AppState {
  return {
    ...defaultState,
    nickname: "수진",
    onboardingComplete: true,
    wardrobe: [
      {
        id: "tee-black",
        category: "top",
        name: "스탠다드 반팔",
        color: "블랙",
        source: "checklist",
        createdAt: "2026-10-14T00:00:00.000Z",
        updatedAt: "2026-10-14T00:00:00.000Z",
        status: "active",
        catalogId: "top-tee-standard",
        imageUrl: "data:image/png;base64,aaaa",
      },
      {
        id: "tee-ivory",
        category: "top",
        name: "스탠다드 반팔",
        color: "아이보리",
        source: "checklist",
        createdAt: "2026-10-14T00:00:00.000Z",
        updatedAt: "2026-10-14T00:00:00.000Z",
        status: "active",
        catalogId: "top-tee-standard",
      },
    ],
    recommendations: [
      {
        id: "look-1",
        eventId: "event-1",
        items: [{ itemId: "tee-black", category: "top", name: "스탠다드 반팔", color: "블랙" }],
        reason: "블랙 반팔",
        variant: "primary",
        saved: true,
        wornStatus: "unspecified",
        createdAt: "2026-10-14T00:00:00.000Z",
      },
    ],
  };
}

describe("closet payload", () => {
  it("keeps each owned color and leaves browser photos out of the upload", () => {
    const payload = toClosetPayload(sampleState());
    expect(payload.wardrobe.map((item) => item.color)).toEqual(["블랙", "아이보리"]);
    expect(payload.wardrobe.every((item) => !item.imageUrl?.startsWith("data:"))).toBe(true);
    expect(payload.looks[0]?.items[0]?.color).toBe("블랙");
    expect(payload.loved).toEqual([]);
    expect(payload.bag).toEqual([]);
  });

  it("restores a saved closet and keeps a local photo on the same item", () => {
    const local = sampleState();
    const next = fromClosetRecord(
      {
        found: true,
        nickname: "수진",
        preferences: local.preferences,
        onboardingComplete: true,
        skippedCategories: [],
        events: [],
        wardrobe: [
          {
            id: "tee-black",
            category: "top",
            name: "스탠다드 반팔",
            color: "블랙",
            source: "checklist",
            createdAt: "2026-10-14T00:00:00.000Z",
            updatedAt: "2026-10-14T00:00:00.000Z",
            status: "active",
            catalogId: "top-tee-standard",
          },
        ],
        looks: local.recommendations,
      },
      local,
    );
    expect(next.nickname).toBe("수진");
    expect(next.wardrobe.find((item) => item.id === "tee-black")?.imageUrl).toBe("data:image/png;base64,aaaa");
    expect(next.recommendations[0]?.items[0]?.color).toBe("블랙");
  });
});
