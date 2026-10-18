import { fromClosetRecord, toClosetPayload, type ClosetPayload, type ClosetRecord } from "./closetMap";
import { supabaseRpc } from "./supabase";
import type { AppState } from "./types";

const DEVICE_KEY = "smart-fashion-calendar:device";

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

export function readDeviceSession(): DeviceSession | null {
  try {
    const raw = localStorage.getItem(DEVICE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DeviceSession>;
    if (!parsed.nickname || !parsed.token) return null;
    return { nickname: parsed.nickname, token: parsed.token };
  } catch {
    return null;
  }
}

export function writeDeviceSession(session: DeviceSession): void {
  localStorage.setItem(DEVICE_KEY, JSON.stringify(session));
}

export function clearDeviceSession(): void {
  localStorage.removeItem(DEVICE_KEY);
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

export async function resumeCloset(session: DeviceSession): Promise<ClosetRecord | null> {
  const data = await supabaseRpc<{ status?: string; closet?: ClosetRecord | null }>("resume_closet", {
    p_nickname: session.nickname,
    p_token: session.token,
  });
  if (data?.status !== "unlocked" || !data.closet || data.closet.found !== true) return null;
  return data.closet;
}

export async function saveCloset(nickname: string, token: string, payload: ClosetPayload): Promise<void> {
  const data = await supabaseRpc<{ ok?: boolean }>("save_closet", {
    p_nickname: nickname.trim(),
    p_token: token,
    p_payload: payload,
  });
  if (!data?.ok) throw new Error("Supabase 저장이 거절되었습니다.");
}

export function applyCloset(record: ClosetRecord, local: AppState): AppState {
  return fromClosetRecord(record, local);
}
