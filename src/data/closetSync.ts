import { fromClosetRecord, toClosetPayload, type ClosetPayload, type ClosetRecord } from "./closetMap";
import { supabaseRpc } from "./supabase";
import type { AppState } from "./types";

const DEVICE_KEY = "smart-fashion-calendar:device";
const LOGGED_OUT_KEY = "smart-fashion-calendar:logged-out";
const SESSION_COOKIE = "sfc_device";
const SESSION_DB = "smart-fashion-calendar";
const SESSION_STORE = "kv";

export interface DeviceSession {
  nickname: string;
  token: string;
}

export type OpenClosetStatus = "created" | "unlocked" | "invalid_pin" | "locked" | "invalid";

interface OpenClosetResult {
  status: OpenClosetStatus;
  token?: string;
  closet?: ClosetRecord | null;
}

export function parseDeviceSession(raw: string | null | undefined): DeviceSession | null {
  if (!raw) return null;
  try {
    return sessionFromUnknown(JSON.parse(raw));
  } catch {
    return null;
  }
}

function sessionFromUnknown(value: unknown): DeviceSession | null {
  if (!value || typeof value !== "object") return null;
  const parsed = value as Partial<DeviceSession>;
  const nickname = typeof parsed.nickname === "string" ? parsed.nickname.trim() : "";
  const token = typeof parsed.token === "string" ? parsed.token.trim() : "";
  if (!nickname || !token) return null;
  return { nickname, token };
}

export function readSessionFromCookie(cookie: string): DeviceSession | null {
  for (const part of cookie.split(";")) {
    const trimmed = part.trim();
    if (!trimmed.startsWith(`${SESSION_COOKIE}=`)) continue;
    try {
      return parseDeviceSession(decodeURIComponent(trimmed.slice(SESSION_COOKIE.length + 1)));
    } catch {
      return null;
    }
  }
  return null;
}

export function readDeviceSession(): DeviceSession | null {
  try {
    const stored = parseDeviceSession(localStorage.getItem(DEVICE_KEY));
    if (stored) return stored;
  } catch {
    // Private mode or blocked storage falls through to the cookie.
  }
  if (typeof document === "undefined") return null;
  return readSessionFromCookie(document.cookie);
}

function writeSessionCookie(session: DeviceSession): void {
  if (typeof document === "undefined") return;
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${SESSION_COOKIE}=${encodeURIComponent(JSON.stringify(session))}; Max-Age=31536000; Path=/; SameSite=Lax${secure}`;
}

function clearSessionCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
}

function openSessionDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    const request = indexedDB.open(SESSION_DB, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(SESSION_STORE)) {
        request.result.createObjectStore(SESSION_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
}

async function readSessionDb(): Promise<DeviceSession | null> {
  const db = await openSessionDb();
  if (!db) return null;
  const session = await new Promise<DeviceSession | null>((resolve) => {
    const request = db.transaction(SESSION_STORE, "readonly").objectStore(SESSION_STORE).get("device");
    request.onsuccess = () => resolve(sessionFromUnknown(request.result));
    request.onerror = () => resolve(null);
  });
  db.close();
  return session;
}

function writeSessionDb(session: DeviceSession): void {
  void openSessionDb().then((db) => {
    if (!db) return;
    const tx = db.transaction(SESSION_STORE, "readwrite");
    tx.objectStore(SESSION_STORE).put(session, "device");
    tx.oncomplete = () => db.close();
    tx.onerror = () => db.close();
  });
}

function deleteSessionDb(): void {
  void openSessionDb().then((db) => {
    if (!db) return;
    const tx = db.transaction(SESSION_STORE, "readwrite");
    tx.objectStore(SESSION_STORE).delete("device");
    tx.oncomplete = () => db.close();
    tx.onerror = () => db.close();
  });
}

export function writeDeviceSession(session: DeviceSession): void {
  try {
    localStorage.removeItem(LOGGED_OUT_KEY);
    localStorage.setItem(DEVICE_KEY, JSON.stringify(session));
  } catch {
    // A full cache should not drop the login. The cookie and IndexedDB still keep it.
  }
  writeSessionCookie(session);
  writeSessionDb(session);
}

export function clearDeviceSession(): void {
  try {
    localStorage.setItem(LOGGED_OUT_KEY, "1");
    localStorage.removeItem(DEVICE_KEY);
  } catch {
    // Ignore blocked storage and still clear the other copies.
  }
  clearSessionCookie();
  deleteSessionDb();
}

/** Reads the saved device login on startup, including copies outside localStorage. */
export async function getSession(): Promise<DeviceSession | null> {
  try {
    if (localStorage.getItem(LOGGED_OUT_KEY) === "1") {
      clearDeviceSession();
      return null;
    }
    const stored = parseDeviceSession(localStorage.getItem(DEVICE_KEY));
    if (stored) return stored;
  } catch {
    // Fall through to the cookie or IndexedDB copy.
  }
  const cookie = typeof document === "undefined" ? null : readSessionFromCookie(document.cookie);
  const recovered = cookie ?? (await readSessionDb());
  if (!recovered) return null;
  writeDeviceSession(recovered);
  return recovered;
}

export function closetPayload(state: AppState): ClosetPayload {
  return toClosetPayload(state);
}

export async function profileExists(nickname: string): Promise<boolean> {
  const data = await supabaseRpc<{ exists?: boolean }>("profile_exists", { p_nickname: nickname.trim() });
  return data?.exists === true;
}

export async function openCloset(nickname: string, pin: string): Promise<OpenClosetResult> {
  const data = await supabaseRpc<OpenClosetResult>("open_closet", {
    p_nickname: nickname.trim(),
    p_pin: pin,
  });
  return data ?? { status: "invalid" };
}

export type ResumeResult =
  | { status: "unlocked"; closet: ClosetRecord }
  | { status: "unauthorized" }
  | { status: "invalid" };

export async function resumeCloset(session: DeviceSession): Promise<ResumeResult> {
  const data = await supabaseRpc<{ status?: string; closet?: ClosetRecord | null }>("resume_closet", {
    p_nickname: session.nickname,
    p_token: session.token,
  });
  if (data?.status === "unlocked" && data.closet?.found === true) {
    return { status: "unlocked", closet: data.closet };
  }
  if (data?.status === "unauthorized") return { status: "unauthorized" };
  return { status: "invalid" };
}

export async function saveCloset(
  nickname: string,
  token: string,
  payload: ClosetPayload,
  keepalive = false,
): Promise<void> {
  const data = await supabaseRpc<{ ok?: boolean }>(
    "save_closet",
    {
      p_nickname: nickname.trim(),
      p_token: token,
      p_payload: payload,
    },
    keepalive,
  );
  if (!data?.ok) throw new SaveRejectedError();
}

export class SaveRejectedError extends Error {
  constructor() {
    super("Supabase 저장이 거절되었습니다.");
    this.name = "SaveRejectedError";
  }
}

export function chooseCloset(remote: ClosetRecord, local: AppState): AppState {
  if (local.onboardingComplete && !remote.onboardingComplete) {
    return { ...local, nickname: remote.nickname || local.nickname };
  }
  return applyCloset(remote, local);
}

export function applyCloset(record: ClosetRecord, local: AppState): AppState {
  return fromClosetRecord(record, local);
}
