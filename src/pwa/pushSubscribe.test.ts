import { describe, expect, it } from "vitest";
import { urlBase64ToUint8Array } from "./pushSubscribe";

describe("urlBase64ToUint8Array", () => {
  it("decodes a URL-safe VAPID key without throwing", () => {
    const bytes = urlBase64ToUint8Array("aGVsbG8");
    expect(Array.from(bytes)).toEqual([104, 101, 108, 108, 111]);
  });
});
