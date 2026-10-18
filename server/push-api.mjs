import fs from "node:fs";
import path from "node:path";
import webpush from "web-push";

const STORE_PATH = path.join(process.cwd(), "server", "subscriptions.json");

export function getVapidConfig(env = process.env) {
  const publicKey = (env.VAPID_PUBLIC_KEY || env.VITE_VAPID_PUBLIC_KEY || "").trim();
  const privateKey = (env.VAPID_PRIVATE_KEY || "").trim();
  const contact = (env.VAPID_CONTACT || "mailto:dev@localhost").trim();
  return {
    publicKey,
    privateKey,
    contact,
    configured: Boolean(publicKey && privateKey),
  };
}

function readSubscriptions() {
  try {
    const raw = fs.readFileSync(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSubscriptions(list) {
  fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(list, null, 2), "utf8");
}

function isPushSubscription(value) {
  return Boolean(value && typeof value === "object" && typeof value.endpoint === "string");
}

export function saveSubscription(subscription) {
  if (!isPushSubscription(subscription)) {
    throw new Error("Invalid subscription");
  }
  const list = readSubscriptions();
  const next = list.filter((entry) => entry.endpoint !== subscription.endpoint);
  next.push(subscription);
  writeSubscriptions(next);
  return next.length;
}

export async function sendPushNotification(subscription, title, body, url = "/") {
  const vapid = getVapidConfig();
  if (!vapid.configured) {
    throw new Error("VAPID keys are not configured");
  }
  webpush.setVapidDetails(vapid.contact, vapid.publicKey, vapid.privateKey);
  const payload = JSON.stringify({ title, body, url });
  await webpush.sendNotification(subscription, payload);
}

export async function sendPushToStoredSubscriptions(title, body, url = "/") {
  const list = readSubscriptions();
  const results = [];
  for (const subscription of list) {
    try {
      await sendPushNotification(subscription, title, body, url);
      results.push({ endpoint: subscription.endpoint, ok: true });
    } catch (error) {
      results.push({
        endpoint: subscription.endpoint,
        ok: false,
        error: error instanceof Error ? error.message : "send failed",
      });
    }
  }
  return { count: list.length, results };
}

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8") || "{}";
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

export function createPushApiMiddleware() {
  return async function pushApiMiddleware(req, res, next) {
    const url = req.url?.split("?")[0] ?? "";
    if (url === "/api/push/status" && req.method === "GET") {
      const vapid = getVapidConfig();
      send(res, 200, {
        vapidPublicKey: vapid.publicKey || null,
        serverConfigured: vapid.configured,
      });
      return;
    }
    if (url === "/api/save-subscription" && req.method === "POST") {
      const vapid = getVapidConfig();
      if (!vapid.configured) {
        send(res, 503, {
          message: "VAPID private key is not configured on the server.",
        });
        return;
      }
      try {
        const body = await readJsonBody(req);
        saveSubscription(body);
        send(res, 201, { message: "Subscription stored locally for this development server." });
      } catch {
        send(res, 400, { message: "Invalid subscription payload." });
      }
      return;
    }
    if (url === "/api/send-push" && req.method === "POST") {
      const vapid = getVapidConfig();
      if (!vapid.configured) {
        send(res, 503, { message: "VAPID keys are not configured." });
        return;
      }
      try {
        const body = await readJsonBody(req);
        const title = typeof body.title === "string" ? body.title : "STUDIO";
        const text = typeof body.body === "string" ? body.body : "다음 약속 코디를 확인할 수 있습니다.";
        const target = typeof body.url === "string" ? body.url : "/";
        const result = await sendPushToStoredSubscriptions(title, text, target);
        send(res, 200, result);
      } catch (error) {
        send(res, 500, {
          message: error instanceof Error ? error.message : "Failed to send push.",
        });
      }
      return;
    }
    next();
  };
}
