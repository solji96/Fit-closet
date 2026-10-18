import { describe, expect, it } from "vitest";
import { STYLE_OPTIONS } from "../data/catalog";
import {
  canonicalizeMood,
  moodOverlaps,
  nextMood,
  normalizeMoodList,
  tryCanonicalizeMood,
} from "./tpo";

describe("style mood options", () => {
  it("exposes six user-facing moods", () => {
    expect(STYLE_OPTIONS.map((option) => option.id)).toEqual([
      "minimal_classic",
      "quiet_luxury",
      "office_chic",
      "natural_comfort",
      "city_casual",
      "romantic_feminine",
    ]);
  });

  it("maps legacy stored moods without dropping them", () => {
    expect(normalizeMoodList(["neat", "comfortable", "trendy", "formal"])).toEqual([
      "minimal_classic",
      "natural_comfort",
      "city_casual",
      "office_chic",
    ]);
    expect(tryCanonicalizeMood("unknown")).toBeNull();
    expect(canonicalizeMood("neat")).toBe("minimal_classic");
  });

  it("matches catalog item tags to the expanded moods", () => {
    expect(moodOverlaps(["neat", "formal"], "quiet_luxury")).toBe(true);
    expect(moodOverlaps(["comfortable"], "office_chic")).toBe(false);
    expect(moodOverlaps(["trendy"], "city_casual")).toBe(true);
  });

  it("cycles through the six moods", () => {
    expect(nextMood("minimal_classic")).toBe("quiet_luxury");
    expect(nextMood("romantic_feminine")).toBe("minimal_classic");
    expect(nextMood("neat")).toBe("quiet_luxury");
  });
});
