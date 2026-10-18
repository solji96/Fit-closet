import type { KeepEntry } from "./keeps";
import type { AppState, CalendarEvent, OutfitRecommendation, UserPreferences, WardrobeItem } from "./types";
import { normalizeState } from "./storage";

export interface ClosetRecord {
  found: true;
  nickname: string;
  preferences: UserPreferences;
  onboardingComplete: boolean;
  skippedCategories: AppState["skippedCategories"];
  events: CalendarEvent[];
  wardrobe: WardrobeItem[];
  looks: OutfitRecommendation[];
  loved?: KeepEntry[];
  bag?: KeepEntry[];
}

export interface ClosetPayload {
  preferences: UserPreferences;
  onboardingComplete: boolean;
  skippedCategories: AppState["skippedCategories"];
  events: CalendarEvent[];
  wardrobe: WardrobeItem[];
  looks: OutfitRecommendation[];
  loved: KeepEntry[];
  bag: KeepEntry[];
}

function withoutLocalPhoto(item: WardrobeItem): WardrobeItem {
  if (!item.imageUrl?.startsWith("data:")) return item;
  const next = { ...item };
  delete next.imageUrl;
  return next;
}

export function toClosetPayload(state: AppState): ClosetPayload {
  return {
    preferences: state.preferences,
    onboardingComplete: state.onboardingComplete,
    skippedCategories: state.skippedCategories,
    events: state.events,
    wardrobe: state.wardrobe.map(withoutLocalPhoto),
    looks: state.recommendations,
    loved: state.loved,
    bag: state.bag,
  };
}

export function fromClosetRecord(record: ClosetRecord, local: AppState): AppState {
  const photos = new Map(
    local.wardrobe.filter((item) => item.imageUrl?.startsWith("data:")).map((item) => [item.id, item.imageUrl]),
  );
  return normalizeState({
    ...local,
    nickname: record.nickname,
    onboardingComplete: record.onboardingComplete,
    preferences: record.preferences,
    skippedCategories: record.skippedCategories ?? [],
    events: record.events ?? [],
    recommendations: record.looks ?? [],
    loved: record.loved ?? [],
    bag: record.bag ?? [],
    wardrobe: (record.wardrobe ?? []).map((item) => ({
      ...item,
      imageUrl: item.imageUrl ?? photos.get(item.id),
    })),
  });
}
