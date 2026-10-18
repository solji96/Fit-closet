import type { PushSubscribeResult } from "../pwa/pushSubscribe";

export type BrowserNotificationPermission = NotificationPermission | "unsupported";

export interface EnableReminderInput {
  supported: boolean;
  permission: BrowserNotificationPermission;
  requestPermission?: () => Promise<NotificationPermission>;
  subscribePush?: () => Promise<PushSubscribeResult>;
}

export interface EnableReminderOutcome {
  kind: "push" | "in_app" | "denied" | "error";
  permission: BrowserNotificationPermission;
  optIn: boolean;
  hideBanner: boolean;
  webPushEnabled: boolean;
  message: string;
  notice?: { title: string; body: string };
}

export const IN_APP_REMINDER_MESSAGE = "다음 코디가 앱 안 알림함에 저장됩니다.";
export const PUSH_READY_MESSAGE = "알림이 설정되었습니다.";
export const DENIED_MESSAGE =
  "알림 권한이 거부되었습니다. 알림함에서 다음 약속을 확인할 수 있습니다.";
export const SAVE_ERROR_MESSAGE = "알림 설정을 저장하지 못했습니다. 다시 시도해 주세요.";
export const SERVER_UNAVAILABLE_MESSAGE =
  "푸시 구독을 서버에 저장하지 못했습니다. 다시 시도하거나 알림함에서 확인하세요.";

const IN_APP_NOTICE = {
  title: "다음 약속 코디 안내",
  body: "원격 푸시 구독은 아직 완료되지 않았습니다. 일정과 알림함에서 다음 코디를 확인하세요.",
};

const PUSH_NOTICE = {
  title: "다음 약속 코디 안내",
  body: "브라우저 알림 구독이 이 기기에 저장되었습니다. 원격 발송은 푸시 서버가 실행 중일 때만 도착합니다.",
};

async function readPermission(
  input: EnableReminderInput,
): Promise<BrowserNotificationPermission> {
  if (!input.supported) return "unsupported";
  if (input.permission === "denied") return "denied";
  if (input.permission === "granted") return "granted";
  const request =
    input.requestPermission ??
    (() =>
      typeof Notification === "undefined"
        ? Promise.resolve("denied" as NotificationPermission)
        : Notification.requestPermission());
  return request();
}

function inAppOutcome(
  permission: BrowserNotificationPermission,
): EnableReminderOutcome {
  return {
    kind: "in_app",
    permission,
    optIn: true,
    hideBanner: true,
    webPushEnabled: false,
    message: IN_APP_REMINDER_MESSAGE,
    notice: IN_APP_NOTICE,
  };
}

export async function enableOutfitReminder(input: EnableReminderInput): Promise<EnableReminderOutcome> {
  if (!input.supported) {
    return inAppOutcome("unsupported");
  }

  let permission: BrowserNotificationPermission = input.permission;
  if (permission === "default" || permission === "unsupported") {
    try {
      permission = await readPermission(input);
    } catch {
      return {
        kind: "error",
        permission: input.permission,
        optIn: false,
        hideBanner: false,
        webPushEnabled: false,
        message: SAVE_ERROR_MESSAGE,
      };
    }
  }

  if (permission === "denied") {
    return {
      kind: "denied",
      permission: "denied",
      optIn: false,
      hideBanner: false,
      webPushEnabled: false,
      message: DENIED_MESSAGE,
    };
  }

  if (permission === "granted" || permission === "unsupported") {
    if (permission === "granted" && input.subscribePush) {
      try {
        const push = await input.subscribePush();
        if (push.status === "subscribed") {
          return {
            kind: "push",
            permission,
            optIn: true,
            hideBanner: true,
            webPushEnabled: true,
            message: PUSH_READY_MESSAGE,
            notice: PUSH_NOTICE,
          };
        }
        if (push.status === "server_unavailable" || push.status === "error") {
          return {
            kind: "error",
            permission,
            optIn: false,
            hideBanner: false,
            webPushEnabled: false,
            message: SERVER_UNAVAILABLE_MESSAGE,
          };
        }
      } catch {
        return {
          kind: "error",
          permission,
          optIn: false,
          hideBanner: false,
          webPushEnabled: false,
          message: SERVER_UNAVAILABLE_MESSAGE,
        };
      }
    }
    return inAppOutcome(permission);
  }

  return {
    kind: "error",
    permission,
    optIn: false,
    hideBanner: false,
    webPushEnabled: false,
    message: SAVE_ERROR_MESSAGE,
  };
}
