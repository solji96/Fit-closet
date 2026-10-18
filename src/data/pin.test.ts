import { describe, expect, it } from "vitest";
import { isPin, normalizePin } from "./pin";

describe("profile pin", () => {
  it("keeps four digits and drops anything else", () => {
    expect(normalizePin("12a34")).toBe("1234");
    expect(normalizePin("123456")).toBe("1234");
    expect(isPin("1234")).toBe(true);
    expect(isPin("123")).toBe(false);
  });
});
