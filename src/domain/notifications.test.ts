import { describe, expect, it } from "vitest";
import {
  DENIED_MESSAGE,
  IN_APP_REMINDER_MESSAGE,
  PUSH_READY_MESSAGE,
  SERVER_UNAVAILABLE_MESSAGE,
  enableOutfitReminder,
} from "./notifications";

describe("enableOutfitReminder", () => {
  it("does not claim push when browser notifications are unsupported", async () => {
    const result = await enableOutfitReminder({
      supported: false,
      permission: "unsupported",
    });
    expect(result.kind).toBe("in_app");
    expect(result.optIn).toBe(true);
    expect(result.hideBanner).toBe(true);
    expect(result.webPushEnabled).toBe(false);
    expect(result.message).toBe(IN_APP_REMINDER_MESSAGE);
    expect(result.notice).toBeDefined();
  });

  it("requests permission only when current state is default", async () => {
    let called = 0;
    const result = await enableOutfitReminder({
      supported: true,
      permission: "default",
      requestPermission: async () => {
        called += 1;
        return "granted";
      },
    });
    expect(called).toBe(1);
    expect(result.kind).toBe("in_app");
    expect(result.message).toBe(IN_APP_REMINDER_MESSAGE);
    expect(result.message).not.toContain("알림이 설정되었습니다");
  });

  it("claims browser push only after a successful subscription save", async () => {
    const result = await enableOutfitReminder({
      supported: true,
      permission: "granted",
      subscribePush: async () => ({ status: "subscribed" }),
    });
    expect(result.kind).toBe("push");
    expect(result.webPushEnabled).toBe(true);
    expect(result.message).toBe(PUSH_READY_MESSAGE);
    expect(result.hideBanner).toBe(true);
  });

  it("keeps the banner when the subscription cannot be stored", async () => {
    const result = await enableOutfitReminder({
      supported: true,
      permission: "granted",
      subscribePush: async () => ({ status: "server_unavailable" }),
    });
    expect(result.kind).toBe("error");
    expect(result.hideBanner).toBe(false);
    expect(result.webPushEnabled).toBe(false);
    expect(result.message).toBe(SERVER_UNAVAILABLE_MESSAGE);
  });

  it("falls back to the in-app inbox when VAPID is not configured", async () => {
    const result = await enableOutfitReminder({
      supported: true,
      permission: "granted",
      subscribePush: async () => ({ status: "unavailable", reason: "no_vapid" }),
    });
    expect(result.kind).toBe("in_app");
    expect(result.webPushEnabled).toBe(false);
    expect(result.message).toBe(IN_APP_REMINDER_MESSAGE);
  });

  it("does not request permission again when already granted", async () => {
    let called = 0;
    const result = await enableOutfitReminder({
      supported: true,
      permission: "granted",
      requestPermission: async () => {
        called += 1;
        return "granted";
      },
    });
    expect(called).toBe(0);
    expect(result.hideBanner).toBe(true);
    expect(result.optIn).toBe(true);
  });

  it("keeps the banner when permission is denied", async () => {
    const result = await enableOutfitReminder({
      supported: true,
      permission: "denied",
      requestPermission: async () => "denied",
    });
    expect(result.kind).toBe("denied");
    expect(result.hideBanner).toBe(false);
    expect(result.optIn).toBe(false);
    expect(result.message).toBe(DENIED_MESSAGE);
    expect(result.notice).toBeUndefined();
  });

  it("returns an error without hiding the banner when the permission prompt fails", async () => {
    const result = await enableOutfitReminder({
      supported: true,
      permission: "default",
      requestPermission: async () => {
        throw new Error("blocked");
      },
    });
    expect(result.kind).toBe("error");
    expect(result.hideBanner).toBe(false);
    expect(result.optIn).toBe(false);
  });
});
