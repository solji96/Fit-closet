import { describe, expect, it } from "vitest";
import { chooseCloset, parseDeviceSession, readSessionFromCookie } from "./closetSync";
import { defaultPreferences, defaultState } from "./storage";
import type { ClosetRecord } from "./closetMap";

function closet(onboardingComplete: boolean): ClosetRecord {
  return {
    found: true,
    nickname: "수진",
    preferences: { ...defaultPreferences, stylePreferences: ["city_casual"] },
    onboardingComplete,
    skippedCategories: [],
    events: [],
    wardrobe: [],
    looks: [],
    loved: [],
    bag: [],
  };
}

describe("device session", () => {
  it("parses a saved login and ignores a broken one", () => {
    expect(parseDeviceSession(JSON.stringify({ nickname: " 수진 ", token: "abc" }))).toEqual({
      nickname: "수진",
      token: "abc",
    });
    expect(parseDeviceSession("{")).toBeNull();
    expect(parseDeviceSession(JSON.stringify({ nickname: "", token: "abc" }))).toBeNull();
  });

  it("reads the login cookie beside other cookies", () => {
    const raw = encodeURIComponent(JSON.stringify({ nickname: "수진", token: "abc" }));
    expect(readSessionFromCookie(`theme=ivory; sfc_device=${raw}`)).toEqual({
      nickname: "수진",
      token: "abc",
    });
  });

  it("keeps a finished closet on this device when the server copy is unfinished", () => {
    const local = { ...defaultState, nickname: "수진", onboardingComplete: true };
    expect(chooseCloset(closet(false), local).onboardingComplete).toBe(true);
  });

  it("restores a finished server closet when this device has no profile yet", () => {
    const restored = chooseCloset(closet(true), defaultState);
    expect(restored.onboardingComplete).toBe(true);
    expect(restored.nickname).toBe("수진");
    expect(restored.preferences.stylePreferences).toEqual(["city_casual"]);
  });
});
