import { sendPushToStoredSubscriptions, getVapidConfig } from "./push-api.mjs";

const vapid = getVapidConfig();
if (!vapid.configured) {
  console.error("VAPID_PUBLIC_KEY와 VAPID_PRIVATE_KEY가 필요합니다. .env.local을 확인하세요.");
  process.exit(1);
}

const title = process.argv[2] || "STUDIO";
const body = process.argv[3] || "다음 약속 코디를 확인할 수 있습니다.";
const result = await sendPushToStoredSubscriptions(title, body, "/");
console.log(JSON.stringify(result, null, 2));
if (result.count === 0) {
  console.error("저장된 구독이 없습니다. 앱에서 알림 받기를 먼저 완료하세요.");
  process.exit(1);
}
