import { STYLE_OPTIONS } from "../data/catalog";
import type { FormalityLevel, ItemMood, StyleMood, TpoType } from "../data/types";

export const STYLE_MOOD_ORDER: StyleMood[] = [
  "minimal_classic",
  "quiet_luxury",
  "office_chic",
  "natural_comfort",
  "city_casual",
  "romantic_feminine",
];

const LEGACY_STYLE_MOOD: Record<string, StyleMood> = {
  neat: "minimal_classic",
  comfortable: "natural_comfort",
  trendy: "city_casual",
  formal: "office_chic",
};

const MOOD_CATALOG_TAGS: Record<StyleMood, ItemMood[]> = {
  minimal_classic: ["neat"],
  quiet_luxury: ["neat", "formal"],
  office_chic: ["formal", "neat"],
  natural_comfort: ["comfortable"],
  city_casual: ["trendy", "comfortable"],
  romantic_feminine: ["neat", "trendy"],
};

export function tryCanonicalizeMood(value: string): StyleMood | null {
  if ((STYLE_MOOD_ORDER as readonly string[]).includes(value)) return value as StyleMood;
  return LEGACY_STYLE_MOOD[value] ?? null;
}

export function canonicalizeMood(value: string | undefined | null): StyleMood {
  return (value ? tryCanonicalizeMood(value) : null) ?? "minimal_classic";
}

export function normalizeMoodList(list: unknown): StyleMood[] {
  if (!Array.isArray(list)) return [];
  const next: StyleMood[] = [];
  for (const entry of list) {
    if (typeof entry !== "string") continue;
    const mood = tryCanonicalizeMood(entry);
    if (mood && !next.includes(mood)) next.push(mood);
  }
  return next;
}

export function catalogTagsForMood(mood: string): ItemMood[] {
  return MOOD_CATALOG_TAGS[canonicalizeMood(mood)];
}

export function moodOverlaps(itemMoods: readonly string[] | undefined, preference: string): boolean {
  if (!itemMoods?.length) return false;
  const tags = new Set<string>(catalogTagsForMood(preference));
  return itemMoods.some((tag) => tags.has(tag) || tryCanonicalizeMood(tag) === canonicalizeMood(preference));
}

export function nextMood(current: string): StyleMood {
  const id = canonicalizeMood(current);
  return STYLE_MOOD_ORDER[(STYLE_MOOD_ORDER.indexOf(id) + 1) % STYLE_MOOD_ORDER.length];
}

export const TPO_OPTIONS: { id: TpoType; label: string; hint: string }[] = [
  { id: "work", label: "출근·업무", hint: "단정하고 세련된 업무 실루엣" },
  { id: "formal_event", label: "격식 있는 모임", hint: "정제된 라운지 격식" },
  { id: "casual", label: "일상 약속", hint: "편안한 외출을 위한 구성" },
  { id: "concert", label: "콘서트·이벤트", hint: "움직임이 자연스럽고 실루엣이 정돈된 구성" },
  { id: "festival", label: "축제·팝업스토어", hint: "움직임이 자연스러운 이벤트 실루엣" },
  { id: "other", label: "기타", hint: "선호 스타일을 중심으로 구성" },
];

export const FORMALITY_OPTIONS: { id: FormalityLevel; label: string }[] = [
  { id: "low", label: "편안함 우선" },
  { id: "medium", label: "보통" },
  { id: "high", label: "격식 높음" },
];

export function tpoLabel(tpo: TpoType): string {
  return TPO_OPTIONS.find((option) => option.id === tpo)?.label ?? tpo;
}

export function targetFormality(tpo: TpoType, override?: FormalityLevel): number {
  if (override === "high") return 5;
  if (override === "low") return 2;
  if (override === "medium") return 3.5;
  switch (tpo) {
    case "formal_event":
      return 5;
    case "work":
      return 4;
    case "casual":
      return 3;
    case "other":
      return 3;
    case "concert":
      return 2.5;
    case "festival":
      return 2;
    default:
      return 3;
  }
}

export function defaultMood(tpo: TpoType, preferences: StyleMood[]): StyleMood {
  const prefs = preferences.map(canonicalizeMood);
  if (prefs.includes("office_chic") && (tpo === "work" || tpo === "formal_event")) {
    return "office_chic";
  }
  if (tpo === "work") return prefs.includes("minimal_classic") ? "minimal_classic" : prefs.includes("quiet_luxury") ? "quiet_luxury" : "office_chic";
  if (tpo === "formal_event") return prefs.includes("quiet_luxury") ? "quiet_luxury" : "office_chic";
  if (tpo === "concert" || tpo === "festival") {
    return prefs.includes("city_casual") ? "city_casual" : prefs.includes("natural_comfort") ? "natural_comfort" : "city_casual";
  }
  return prefs[0] ?? "minimal_classic";
}

export function moodLabel(mood: string): string {
  const id = canonicalizeMood(mood);
  return STYLE_OPTIONS.find((option) => option.id === id)?.label ?? id;
}
