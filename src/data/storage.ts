import { ALL_CATALOG, catalogFieldsForWardrobe, resolveCatalogId } from "./catalog";
import { sanitizeKeeps } from "./keeps";
import { displayItemName } from "../domain/tags";
import { canonicalizeMood, normalizeMoodList } from "../domain/tpo";
import { STORAGE_KEY, type AppState, type UserPreferences, type WardrobeItem } from "./types";

export const defaultPreferences: UserPreferences = {
  ageGroup: "",
  stylePreferences: [],
  preferredColors: [],
  avoidStyles: [],
};

export const defaultState: AppState = {
  nickname: "",
  onboardingComplete: false,
  preferences: defaultPreferences,
  loved: [],
  bag: [],
  wardrobe: [],
  events: [],
  recommendations: [],
  feedback: [],
  notices: [],
  firstOutfitSeen: false,
  notificationOptIn: false,
  notificationPermission: typeof Notification === "undefined" ? "unsupported" : "default",
  webPushEnabled: false,
  installDismissedAt: null,
  notificationBannerDismissed: false,
  skippedCategories: [],
  weather: null,
  weatherStatus: "idle",
  weatherMessage: null,
};

export function normalizeState(parsed: Partial<AppState>): AppState {
  return {
    ...structuredClone(defaultState),
    ...parsed,
    nickname: typeof parsed.nickname === "string" ? parsed.nickname.trim().slice(0, 24) : "",
    preferences: {
      ...defaultPreferences,
      ...parsed.preferences,
      stylePreferences: normalizeMoodList(parsed.preferences?.stylePreferences),
      avoidStyles: normalizeMoodList(parsed.preferences?.avoidStyles),
    },
    wardrobe: (parsed.wardrobe ?? []).map((item) => {
      const catalogId = item.catalogId ? resolveCatalogId(item.catalogId) : item.catalogId;
      const catalog = catalogId ? ALL_CATALOG.find((entry) => entry.id === catalogId) : undefined;
      const fromCatalog: Partial<WardrobeItem> = catalog ? catalogFieldsForWardrobe(catalog) : {};
      return {
        ...item,
        catalogId,
        status: item.status ?? "active",
        updatedAt: item.updatedAt ?? item.createdAt,
        itemType: item.itemType ?? fromCatalog.itemType,
        style: item.style ?? fromCatalog.style,
        family: item.family ?? fromCatalog.family,
        length: item.length ?? fromCatalog.length,
        fit: item.fit ?? fromCatalog.fit,
        colorTone: item.colorTone ?? fromCatalog.colorTone,
        material: item.material ?? fromCatalog.material,
        name: catalog?.name ?? (item.name ? displayItemName(item.name) : item.name),
      };
    }),
    recommendations: (parsed.recommendations ?? []).map((rec) => ({
      ...rec,
      mood: rec.mood ? canonicalizeMood(String(rec.mood)) : rec.mood,
    })),
    loved: sanitizeKeeps(parsed.loved),
    bag: sanitizeKeeps(parsed.bag),
    skippedCategories: parsed.skippedCategories ?? [],
    webPushEnabled: parsed.webPushEnabled ?? false,
    weather: parsed.weather ?? null,
    weatherStatus: parsed.weatherStatus ?? (parsed.weather ? "ready" : "idle"),
    weatherMessage: parsed.weatherMessage ?? null,
  };
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaultState);
    return normalizeState(JSON.parse(raw) as Partial<AppState>);
  } catch {
    return structuredClone(defaultState);
  }
}

function withoutInlinePhotos(state: AppState): AppState {
  return {
    ...state,
    wardrobe: state.wardrobe.map((item) => {
      if (!item.imageUrl?.startsWith("data:")) return item;
      const next = { ...item };
      delete next.imageUrl;
      return next;
    }),
  };
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(withoutInlinePhotos(state)));
    } catch {
      // Quota or private mode: the device session is stored separately.
    }
  }
}

export function persistenceNote(nickname?: string): string {
  if (!nickname) return "닉네임을 정하면 옷장과 룩북이 Supabase에 저장됩니다.";
  return `닉네임 ${nickname}의 옷장과 룩북은 Supabase에 저장되어 있어요. 이 기기는 확인을 기억해서 다음에도 바로 열려요.`;
}
