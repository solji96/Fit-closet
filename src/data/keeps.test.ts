import { describe, expect, it } from "vitest";
import { isKept, lookKeepId, pruneItemKeeps, sanitizeKeeps, toggleKeep, type KeepEntry } from "./keeps";

const tee: KeepEntry = { kind: "item", id: "tee", name: "스탠다드 반팔", detail: "블랙" };

describe("keeps", () => {
  it("toggles an item on and off", () => {
    const loved = toggleKeep([], tee);
    expect(isKept(loved, "item", "tee")).toBe(true);
    expect(toggleKeep(loved, tee)).toEqual([]);
  });

  it("drops removed wardrobe items and keeps looks and wishes", () => {
    const list = pruneItemKeeps(
      [
        tee,
        { kind: "look", id: "a|b", name: "룩" },
        { kind: "wish", id: "wish-1", name: "제안" },
      ],
      new Set(["other"]),
    );
    expect(list.map((entry) => entry.kind)).toEqual(["look", "wish"]);
  });

  it("ignores malformed rows and builds a stable look id", () => {
    expect(sanitizeKeeps([{ kind: "nope" }, { kind: "item", id: "ok", name: "코트" }, null])).toEqual([
      { kind: "item", id: "ok", name: "코트" },
    ]);
    expect(lookKeepId(["b", "a"])).toBe("a|b");
  });
});
