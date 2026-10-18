import { describe, expect, it } from "vitest";
import { displayItemName, itemDisplayTags, uniqueDisplayTags } from "./tags";

describe("uniqueDisplayTags", () => {
  it("drops duplicate labels", () => {
    expect(uniqueDisplayTags(["인디고", "데님", "데님"])).toEqual(["인디고", "데님"]);
  });
});

describe("itemDisplayTags", () => {
  it("shows denim tone and fit once", () => {
    expect(
      itemDisplayTags({
        color: "인디고",
        colorTone: "다크 인디고",
        fit: "straight",
        style: "denim",
        material: "데님",
        fitLabel: "스트레이트",
        styleLabel: "데님",
      }),
    ).toEqual(["다크 인디고", "스트레이트"]);
  });

  it("shows 박시 as 오버핏 without changing other words", () => {
    expect(displayItemName("박시 가디건")).toBe("오버핏 가디건");
  });

  it("shows 꾸안꾸 as 컴포터블 캐주얼 without changing stored identifiers", () => {
    expect(displayItemName("꾸안꾸 조거")).toBe("컴포터블 캐주얼 조거");
    expect(displayItemName("내추럴 라운지")).toBe("컴포터블 캐주얼");
  });
});
