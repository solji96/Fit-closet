import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
} from "react";
import {
  ALL_CATALOG,
  catalogFieldsForWardrobe,
  isSkipId,
  normalizeChecklistIds,
  parsePaletteCatalogId,
  resolveCatalogId,
  SKIP_IDS,
} from "./catalog";
import { pruneItemKeeps, toggleKeep } from "./keeps";
import type { KeepEntry } from "./keeps";
import { toClosetPayload } from "./closetMap";
import { applyCloset, chooseCloset, clearDeviceSession, getSession, openCloset, profileExists, resumeCloset, saveCloset, writeDeviceSession } from "./closetSync";
import { SupabaseConfigError } from "./supabase";
import { defaultState, loadState, saveState } from "./storage";
import { normalizeMoodList } from "../domain/tpo";
import { weatherBand } from "./weather";
import type {
  AppState,
  CalendarEvent,
  Feedback,
  FormalityLevel,
  OutfitRecommendation,
  StyleMood,
  TpoType,
  UserPreferences,
  WardrobeItem,
  WardrobeStatus,
  WeatherSnapshot,
} from "./types";
import {
  buildReason,
  moreFormalOutfit,
  recommendOutfit,
  rerollCategory,
  shiftMoodOutfit,
  toRecommendation,
} from "../domain/recommend";

type Action =
  | { type: "hydrate"; state: AppState }
  | { type: "set_nickname"; nickname: string }
  | { type: "toggle_keep"; list: "loved" | "bag"; entry: KeepEntry }
  | { type: "complete_onboarding"; preferences: UserPreferences; checklistIds: string[]; itemColors?: Record<string, string[]> }
  | { type: "update_preferences"; preferences: UserPreferences }
  | { type: "set_checklist"; checklistIds: string[]; itemColors?: Record<string, string[]> }
  | { type: "add_photo_item"; item: WardrobeItem }
  | { type: "update_wardrobe_item"; item: WardrobeItem }
  | { type: "remove_wardrobe_item"; id: string }
  | { type: "upsert_event"; event: CalendarEvent }
  | { type: "delete_event"; id: string }
  | { type: "ensure_recommendations"; eventId: string }
  | { type: "refresh_recommendations"; eventId?: string }
  | { type: "replace_recommendation"; previousId: string; next: OutfitRecommendation }
  | { type: "patch_recommendation"; id: string; patch: Partial<OutfitRecommendation> }
  | { type: "add_feedback"; feedback: Feedback }
  | { type: "mark_first_outfit_seen" }
  | { type: "set_notification"; optIn: boolean; permission: AppState["notificationPermission"]; webPushEnabled?: boolean }
  | { type: "dismiss_notification_banner" }
  | { type: "dismiss_install"; at: string }
  | { type: "add_notice"; title: string; body: string; eventId?: string }
  | { type: "mark_notice_read"; id: string }
  | { type: "set_wardrobe_status"; id: string; status: WardrobeStatus }
  | {
      type: "set_weather";
      weather: WeatherSnapshot | null;
      weatherStatus: AppState["weatherStatus"];
      weatherMessage: string | null;
    }
  | { type: "refresh_weather"; weather: WeatherSnapshot }
  | {
      type: "set_look_context";
      eventId?: string;
      tpo?: TpoType;
      weather?: WeatherSnapshot | null;
      weatherStatus?: AppState["weatherStatus"];
      weatherMessage?: string | null;
    };

function skippedFromIds(ids: string[]): Array<"bag" | "accessory"> {
  const normalized = normalizeChecklistIds(ids);
  const skipped: Array<"bag" | "accessory"> = [];
  if (normalized.includes(SKIP_IDS.bag)) skipped.push("bag");
  if (normalized.includes(SKIP_IDS.accessory)) skipped.push("accessory");
  return skipped;
}

function priorColors(existing: WardrobeItem[], catalogId: string): string[] {
  const colors: string[] = [];
  for (const item of existing) {
    if (item.source !== "checklist" || !item.color) continue;
    const id = item.catalogId ? resolveCatalogId(item.catalogId) : "";
    if (id === catalogId && !colors.includes(item.color)) colors.push(item.color);
  }
  return colors;
}

function ownedColors(
  catalogId: string,
  existing: WardrobeItem[],
  itemColors: Record<string, string[]> | undefined,
  fallback: string,
): string[] {
  if (itemColors && catalogId in itemColors) {
    return itemColors[catalogId].filter((color, index, list) => Boolean(color) && list.indexOf(color) === index);
  }
  const prior = priorColors(existing, catalogId);
  if (prior.length) return prior;
  return [fallback];
}

function checklistToWardrobe(
  ids: string[],
  existing: WardrobeItem[],
  itemColors?: Record<string, string[]>,
): WardrobeItem[] {
  ids = normalizeChecklistIds(ids);
  const photos = existing.filter((item) => item.source === "photo");
  const used = new Set<string>();
  const now = new Date().toISOString();
  const checklist: WardrobeItem[] = [];

  const takeMatch = (catalogId: string, color?: string) => {
    const found = existing.find((item) => {
      if (used.has(item.id) || item.source !== "checklist") return false;
      const id = item.catalogId ? resolveCatalogId(item.catalogId) : "";
      if (id !== catalogId) return false;
      return color ? item.color === color : true;
    });
    if (found) used.add(found.id);
    return found;
  };

  for (const id of ids) {
    if (isSkipId(id)) continue;
    const palette = parsePaletteCatalogId(id);
    if (palette) {
      const found = takeMatch(id);
      if (found) {
        checklist.push({
          ...found,
          status: found.status ?? "active",
          updatedAt: found.updatedAt ?? found.createdAt,
        });
        continue;
      }
      const template = ALL_CATALOG.find((entry) => entry.category === palette.category);
      checklist.push({
        id: String(crypto.randomUUID()),
        category: palette.category,
        name: palette.category === "top" ? `상의 · ${palette.color}` : `하의 · ${palette.color}`,
        color: palette.color,
        source: "checklist",
        createdAt: now,
        updatedAt: now,
        status: "active",
        catalogId: id,
        formality: template?.formality ?? 3,
        moods: template?.moods ?? ["neat", "comfortable"],
        itemType: palette.category,
        style: template?.moods[0],
      });
      continue;
    }
    const catalog = ALL_CATALOG.find((entry) => entry.id === id);
    if (!catalog) continue;
    const fields = catalogFieldsForWardrobe(catalog);
    for (const color of ownedColors(catalog.id, existing, itemColors, catalog.defaultColor)) {
      const found = takeMatch(catalog.id, color);
      if (found) {
        checklist.push({
          ...found,
          ...fields,
          color,
          catalogId: catalog.id,
          status: found.status ?? "active",
          updatedAt: found.updatedAt ?? found.createdAt,
        });
        continue;
      }
      checklist.push({
        id: String(crypto.randomUUID()),
        category: catalog.category,
        source: "checklist",
        createdAt: now,
        updatedAt: now,
        status: "active",
        catalogId: catalog.id,
        ...fields,
        color,
      });
    }
  }

  return [...checklist, ...photos];
}

function keptForWardrobe(state: AppState, wardrobe: WardrobeItem[]) {
  const ids = new Set(wardrobe.map((item) => item.id));
  return {
    loved: pruneItemKeeps(state.loved, ids),
    bag: pruneItemKeeps(state.bag, ids),
  };
}

function ensureForEvent(state: AppState, eventId: string): AppState {
  const event = state.events.find((entry) => entry.id === eventId);
  if (!event) return state;
  const existing = state.recommendations.filter((rec) => rec.eventId === eventId);
  if (existing.some((rec) => rec.variant === "primary")) return state;
  const result = recommendOutfit({
    event,
    wardrobe: state.wardrobe,
    preferences: state.preferences,
    weather: state.weather ?? undefined,
  });
  const next = [...state.recommendations];
  if (result.primary) {
    next.push(
      toRecommendation(eventId, result.primary, "primary", result.reason, {
        mood: result.mood,
      }),
    );
  }
  if (result.alternative) {
    next.push(
      toRecommendation(
        eventId,
        result.alternative,
        "alternative",
        buildReason(event, result.mood, result.alternative.items, state.preferences, state.weather ?? undefined),
        { mood: result.mood },
      ),
    );
  }
  return { ...state, recommendations: next };
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "hydrate":
      return action.state;
    case "set_nickname":
      return { ...state, nickname: action.nickname.trim().slice(0, 24) };
    case "toggle_keep":
      return {
        ...state,
        [action.list]: toggleKeep(state[action.list], action.entry),
      };
    case "complete_onboarding": {
      const wardrobe = checklistToWardrobe(action.checklistIds, state.wardrobe, action.itemColors);
      return {
        ...state,
        onboardingComplete: true,
        preferences: {
          ...action.preferences,
          stylePreferences: normalizeMoodList(action.preferences.stylePreferences),
          avoidStyles: normalizeMoodList(action.preferences.avoidStyles),
        },
        wardrobe,
        skippedCategories: skippedFromIds(action.checklistIds),
        ...keptForWardrobe(state, wardrobe),
        recommendations: [],
      };
    }
    case "update_preferences":
      return {
        ...state,
        preferences: {
          ...action.preferences,
          stylePreferences: normalizeMoodList(action.preferences.stylePreferences),
          avoidStyles: normalizeMoodList(action.preferences.avoidStyles),
        },
      };
    case "set_checklist": {
      const wardrobe = checklistToWardrobe(action.checklistIds, state.wardrobe, action.itemColors);
      return {
        ...state,
        wardrobe,
        skippedCategories: skippedFromIds(action.checklistIds),
        recommendations: [],
        ...keptForWardrobe(state, wardrobe),
      };
    }
    case "add_photo_item":
      return { ...state, wardrobe: [...state.wardrobe, action.item], recommendations: [] };
    case "update_wardrobe_item":
      return {
        ...state,
        wardrobe: state.wardrobe.map((item) =>
          item.id === action.item.id ? { ...action.item, updatedAt: new Date().toISOString() } : item,
        ),
        recommendations: [],
      };
    case "remove_wardrobe_item": {
      const wardrobe = state.wardrobe.filter((item) => item.id !== action.id);
      return {
        ...state,
        wardrobe,
        recommendations: [],
        ...keptForWardrobe(state, wardrobe),
      };
    }
    case "upsert_event": {
      const exists = state.events.some((event) => event.id === action.event.id);
      const events = exists
        ? state.events.map((event) => (event.id === action.event.id ? action.event : event))
        : [...state.events, action.event];
      const recommendations = exists
        ? state.recommendations.filter((rec) => rec.eventId !== action.event.id)
        : state.recommendations;
      return ensureForEvent({ ...state, events, recommendations }, action.event.id);
    }
    case "delete_event":
      return {
        ...state,
        events: state.events.filter((event) => event.id !== action.id),
        recommendations: state.recommendations.filter((rec) => rec.eventId !== action.id),
      };
    case "ensure_recommendations":
      return ensureForEvent(state, action.eventId);
    case "refresh_recommendations": {
      const eventIds = action.eventId ? [action.eventId] : state.events.map((event) => event.id);
      let next: AppState = {
        ...state,
        recommendations: action.eventId
          ? state.recommendations.filter((rec) => rec.eventId !== action.eventId)
          : [],
      };
      for (const id of eventIds) {
        next = ensureForEvent(next, id);
      }
      return next;
    }
    case "replace_recommendation":
      return {
        ...state,
        recommendations: state.recommendations.map((rec) =>
          rec.id === action.previousId ? action.next : rec,
        ),
      };
    case "patch_recommendation":
      return {
        ...state,
        recommendations: state.recommendations.map((rec) =>
          rec.id === action.id ? { ...rec, ...action.patch } : rec,
        ),
      };
    case "add_feedback":
      return { ...state, feedback: [...state.feedback, action.feedback] };
    case "mark_first_outfit_seen":
      return state.firstOutfitSeen ? state : { ...state, firstOutfitSeen: true };
    case "set_notification":
      return {
        ...state,
        notificationOptIn: action.optIn,
        notificationPermission: action.permission,
        webPushEnabled: action.optIn ? Boolean(action.webPushEnabled) : false,
      };
    case "dismiss_notification_banner":
      return { ...state, notificationBannerDismissed: true };
    case "dismiss_install":
      return { ...state, installDismissedAt: action.at };
    case "add_notice":
      return {
        ...state,
        notices: [
          {
            id: crypto.randomUUID(),
            title: action.title,
            body: action.body,
            eventId: action.eventId,
            createdAt: new Date().toISOString(),
            read: false,
          },
          ...state.notices,
        ],
      };
    case "mark_notice_read":
      return {
        ...state,
        notices: state.notices.map((notice) =>
          notice.id === action.id ? { ...notice, read: true } : notice,
        ),
      };
    case "set_wardrobe_status":
      return {
        ...state,
        wardrobe: state.wardrobe.map((item) =>
          item.id === action.id
            ? { ...item, status: action.status, updatedAt: new Date().toISOString() }
            : item,
        ),
        recommendations: [],
      };
    case "set_look_context": {
      const now = new Date();
      const today = now.toISOString().slice(0, 10);
      const clock = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const current =
        (action.eventId ? state.events.find((event) => event.id === action.eventId) : undefined) ??
        state.events.find((event) => event.date === today) ??
        null;
      const tpo = action.tpo ?? current?.tpo ?? "casual";
      const event: CalendarEvent = current
        ? { ...current, tpo, updatedAt: now.toISOString() }
        : {
            id: crypto.randomUUID(),
            date: today,
            time: clock,
            tpo,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
          };
      const events = current
        ? state.events.map((entry) => (entry.id === event.id ? event : entry))
        : [event, ...state.events];
      const weather = action.weather === undefined ? state.weather : action.weather;
      const next: AppState = {
        ...state,
        events,
        weather,
        weatherStatus: action.weatherStatus ?? (weather ? "ready" : state.weatherStatus),
        weatherMessage: action.weatherMessage === undefined ? state.weatherMessage : action.weatherMessage,
        recommendations: state.recommendations.filter((rec) => rec.eventId !== event.id),
      };
      return ensureForEvent(next, event.id);
    }
    case "refresh_weather": {
      const previous = state.weather;
      const bandChanged =
        !previous || weatherBand(previous.temperatureCelsius) !== weatherBand(action.weather.temperatureCelsius);
      let next: AppState = {
        ...state,
        weather: action.weather,
        weatherStatus: "ready",
        weatherMessage: null,
        recommendations: bandChanged ? [] : state.recommendations,
      };
      if (bandChanged) {
        for (const event of next.events) {
          next = ensureForEvent(next, event.id);
        }
      }
      return next;
    }
    case "set_weather": {
      let next: AppState = {
        ...state,
        weather: action.weather,
        weatherStatus: action.weatherStatus,
        weatherMessage: action.weatherMessage,
        recommendations: action.weather ? [] : state.recommendations,
      };
      if (action.weather) {
        for (const event of next.events) {
          next = ensureForEvent(next, event.id);
        }
      }
      return next;
    }
    default:
      return state;
  }
}

interface StoreValue {
  state: AppState;
  dispatch: Dispatch<Action>;
  ready: boolean;
  syncMessage: string | null;
  signedIn: boolean;
  profileExists: (nickname: string) => Promise<boolean>;
  openWithPin: (nickname: string, pin: string) => Promise<"created" | "unlocked" | "invalid_pin" | "locked" | "error">;
  applyQuickEdit: (
    rec: OutfitRecommendation,
    action:
      | "reroll_top"
      | "change_bottom"
      | "more_formal"
      | "other_mood",
  ) => { ok: true } | { ok: false; message: string };
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, defaultState);
  const [ready, setReady] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const canSync = useRef(false);
  const lastPayload = useRef("");
  const deviceToken = useRef<string | null>(null);

  const stateRef = useRef(state);
  stateRef.current = state;

  const flushCloset = useCallback((keepalive = false) => {
    const current = stateRef.current;
    if (!canSync.current || !deviceToken.current || !current.nickname || !current.onboardingComplete) return;
    const payload = toClosetPayload(current);
    const body = JSON.stringify(payload);
    if (body === lastPayload.current) return;
    const token = deviceToken.current;
    void saveCloset(current.nickname, token, payload, keepalive)
      .then(() => {
        lastPayload.current = body;
        setSyncMessage(null);
      })
      .catch((error: unknown) => {
        if (keepalive && document.visibilityState === "hidden") return;
        setSyncMessage(
          error instanceof SupabaseConfigError
            ? "Supabase 연결 설정이 배포에 없습니다. 환경 변수를 넣은 뒤 다시 배포해 주세요."
            : "Supabase에 저장하지 못했습니다. 연결을 확인한 뒤 다시 시도해 주세요.",
        );
      });
  }, []);

  useEffect(() => {
    let cancel = false;
    const local = loadState();
    const start = async () => {
      const session = await getSession();
      if (cancel) return;
      if (!session) {
        canSync.current = false;
        dispatch({ type: "hydrate", state: local });
        setReady(true);
        return;
      }
      deviceToken.current = session.token;
      canSync.current = true;
      const keepLocal = (nickname = session.nickname) => {
        dispatch({
          type: "hydrate",
          state: { ...local, nickname: local.nickname || nickname },
        });
        setSignedIn(true);
        setReady(true);
      };
      try {
        const result = await resumeCloset(session);
        if (cancel) return;
        if (result.status === "unauthorized") {
          clearDeviceSession();
          deviceToken.current = null;
          canSync.current = false;
          dispatch({ type: "hydrate", state: local });
          setReady(true);
          return;
        }
        if (result.status === "invalid") {
          keepLocal();
          return;
        }
        writeDeviceSession(session);
        const next = chooseCloset(result.closet, local);
        if (result.closet.onboardingComplete) lastPayload.current = JSON.stringify(toClosetPayload(next));
        dispatch({ type: "hydrate", state: next });
        setSignedIn(true);
        setReady(true);
      } catch {
        if (cancel) return;
        keepLocal();
        setSyncMessage("Supabase에서 옷장을 불러오지 못했습니다. 이 기기의 프로필은 그대로 열어 두었습니다.");
      }
    };
    void start();
    return () => {
      cancel = true;
    };
  }, []);

  useEffect(() => {
    if (ready) saveState(state);
  }, [state, ready]);

  const savedOnce = useRef(false);

  useEffect(() => {
    if (!ready || !canSync.current || !signedIn || !deviceToken.current || !state.nickname || !state.onboardingComplete) return;
    const delay = savedOnce.current ? 600 : 0;
    savedOnce.current = true;
    const timer = window.setTimeout(() => flushCloset(false), delay);
    return () => window.clearTimeout(timer);
  }, [flushCloset, ready, signedIn, state]);

  useEffect(() => {
    const flush = () => flushCloset(true);
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [flushCloset]);

  const openWithPin = useCallback(async (nickname: string, pin: string) => {
    const name = nickname.trim().slice(0, 24);
    if (!name) return "error" as const;
    try {
      const result = await openCloset(name, pin);
      if ((result.status === "created" || result.status === "unlocked") && result.token) {
        deviceToken.current = result.token;
        writeDeviceSession({ nickname: name, token: result.token });
        canSync.current = true;
        if (result.status === "unlocked" && result.closet?.found) {
          const next = applyCloset(result.closet, loadState());
          lastPayload.current = JSON.stringify(toClosetPayload(next));
          dispatch({ type: "hydrate", state: next });
        } else {
          dispatch({ type: "set_nickname", nickname: name });
        }
        setSignedIn(true);
        setSyncMessage(null);
        return result.status;
      }
      if (result.status === "invalid_pin" || result.status === "locked") return result.status;
      return "error" as const;
    } catch {
      setSyncMessage("Supabase에서 옷장을 불러오지 못했습니다. 연결을 확인한 뒤 다시 시도해 주세요.");
      return "error" as const;
    }
  }, []);

  const value = useMemo<StoreValue>(() => {
    return {
      state,
      dispatch,
      ready,
      syncMessage,
      signedIn,
      profileExists,
      openWithPin,
      applyQuickEdit: (rec, edit) => {
        const event = state.events.find((entry) => entry.id === rec.eventId);
        if (!event) return { ok: false, message: "일정을 찾을 수 없습니다." };
        const ctx = {
          event,
          wardrobe: state.wardrobe,
          preferences: state.preferences,
          mood: rec.mood,
          formalBoost: rec.formalBoost,
          weather: state.weather ?? undefined,
        };
        if (edit === "reroll_top" || edit === "change_bottom") {
          const category = edit === "reroll_top" ? "top" : "bottom";
          const { combination, message } = rerollCategory(ctx, rec, category);
          if (!combination) return { ok: false, message: message ?? "다른 조합을 구성하기 어렵습니다." };
          const next = toRecommendation(event.id, combination, rec.variant, buildReason(event, rec.mood ?? ctx.mood ?? "minimal_classic", combination.items, state.preferences, state.weather ?? undefined), {
            id: rec.id,
            saved: rec.saved,
            wornStatus: rec.wornStatus,
            createdAt: rec.createdAt,
            mood: rec.mood,
            formalBoost: rec.formalBoost,
          });
          dispatch({ type: "replace_recommendation", previousId: rec.id, next });
          dispatch({
            type: "add_feedback",
            feedback: {
              recommendationId: rec.id,
              action: edit,
              changedCategory: category,
              createdAt: new Date().toISOString(),
            },
          });
          return { ok: true };
        }
        if (edit === "more_formal") {
          const shifted = moreFormalOutfit(ctx, rec);
          if (!shifted.ok) {
            return { ok: false, message: shifted.message };
          }
          const next = toRecommendation(event.id, shifted.combination, rec.variant, shifted.reason, {
            id: rec.id,
            saved: rec.saved,
            wornStatus: rec.wornStatus,
            createdAt: rec.createdAt,
            mood: "office_chic",
            formalBoost: true,
          });
          dispatch({ type: "replace_recommendation", previousId: rec.id, next });
          dispatch({
            type: "add_feedback",
            feedback: { recommendationId: rec.id, action: "more_formal", createdAt: new Date().toISOString() },
          });
          return { ok: true };
        }
        const shifted = shiftMoodOutfit(ctx, rec);
        if (!shifted.ok) {
          return { ok: false, message: shifted.message };
        }
        const next = toRecommendation(event.id, shifted.combination, rec.variant, shifted.reason, {
          id: rec.id,
          saved: rec.saved,
          wornStatus: rec.wornStatus,
          createdAt: rec.createdAt,
          mood: shifted.mood,
          formalBoost: false,
        });
        dispatch({ type: "replace_recommendation", previousId: rec.id, next });
        dispatch({
          type: "add_feedback",
          feedback: { recommendationId: rec.id, action: "other_mood", createdAt: new Date().toISOString() },
        });
        return { ok: true };
      },
    };
  }, [openWithPin, ready, signedIn, state, syncMessage]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("StoreProvider required");
  return ctx;
}

export type { TpoType, FormalityLevel, StyleMood };
