import type { KeepEntry } from "./keeps";

export type { KeepEntry };

export type AgeGroup = "10s20s" | "20s30s" | "40s50s" | "";

/** Catalog and wardrobe tags used by the rule-based recommender. */
export type ItemMood = "neat" | "comfortable" | "trendy" | "formal";

/** User-facing style preference. Legacy ItemMood values are mapped on load. */
export type StyleMood =
  | "minimal_classic"
  | "quiet_luxury"
  | "office_chic"
  | "natural_comfort"
  | "city_casual"
  | "romantic_feminine";

export type ItemCategory =
  | "top"
  | "bottom"
  | "skirt"
  | "outer"
  | "shoes"
  | "bag"
  | "accessory";

export type WardrobeStatus = "active" | "archived";

export type TpoType =
  | "work"
  | "formal_event"
  | "casual"
  | "concert"
  | "festival"
  | "other";

export type FormalityLevel = "low" | "medium" | "high";

export type WornStatus = "unspecified" | "worn" | "not_worn";

export type OutfitVariant = "primary" | "alternative";

export type WardrobeSource = "checklist" | "photo";

export interface UserPreferences {
  ageGroup: AgeGroup;
  stylePreferences: StyleMood[];
  preferredColors: string[];
  avoidStyles: StyleMood[];
}

export interface WardrobeItem {
  id: string;
  category: ItemCategory;
  name: string;
  color?: string;
  imageUrl?: string;
  source: WardrobeSource;
  createdAt: string;
  updatedAt: string;
  status: WardrobeStatus;
  catalogId?: string;
  formality?: number;
  moods?: ItemMood[];
  itemType?: string;
  style?: string;
  material?: string;
  fit?: string;
  colorTone?: string;
  length?: "short" | "midi" | "long";
  family?: string;
}

export interface WeatherSnapshot {
  temperatureCelsius: number;
  conditionCode?: number;
  locationLabel?: string;
  fetchedAt: string;
  precipitationMm?: number;
  windSpeedKmh?: number;
  temperatureMinCelsius?: number;
  temperatureMaxCelsius?: number;
  source: "geolocation" | "manual";
}

export interface CalendarEvent {
  id: string;
  date: string;
  time: string;
  tpo: TpoType;
  formality?: FormalityLevel;
  placeType?: string;
  scheduleStatus?: "upcoming" | "completed";
  createdAt: string;
  updatedAt: string;
}

export interface OutfitItemRef {
  itemId: string;
  category: ItemCategory;
  name: string;
  color?: string;
}

export interface OutfitRecommendation {
  id: string;
  eventId: string;
  items: OutfitItemRef[];
  reason: string;
  variant: OutfitVariant;
  saved: boolean;
  wornStatus: WornStatus;
  createdAt: string;
  mood?: StyleMood;
  formalBoost?: boolean;
}

export interface Feedback {
  recommendationId: string;
  action:
    | "save"
    | "unsave"
    | "worn"
    | "not_worn"
    | "select_alternative"
    | "reroll_top"
    | "change_bottom"
    | "more_formal"
    | "other_mood";
  changedCategory?: ItemCategory;
  createdAt: string;
}

export interface ComplementItem {
  id: string;
  name: string;
  category: ItemCategory;
  reason: string;
  imageUrl?: string;
  affiliateUrl?: string;
  isAffiliate: boolean;
  isDemo: boolean;
}

export interface InAppNotice {
  id: string;
  title: string;
  body: string;
  eventId?: string;
  createdAt: string;
  read: boolean;
}

export interface AppState {
  nickname: string;
  onboardingComplete: boolean;
  preferences: UserPreferences;
  loved: KeepEntry[];
  bag: KeepEntry[];
  wardrobe: WardrobeItem[];
  events: CalendarEvent[];
  recommendations: OutfitRecommendation[];
  feedback: Feedback[];
  notices: InAppNotice[];
  firstOutfitSeen: boolean;
  notificationOptIn: boolean;
  notificationPermission: NotificationPermission | "unsupported";
  webPushEnabled: boolean;
  installDismissedAt: string | null;
  notificationBannerDismissed: boolean;
  skippedCategories: Array<"bag" | "accessory">;
  weather: WeatherSnapshot | null;
  weatherStatus: "idle" | "ready" | "denied" | "unsupported" | "error";
  weatherMessage: string | null;
}

export const STORAGE_KEY = "smart-fashion-calendar:v1";
