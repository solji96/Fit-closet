import { ALL_CATALOG } from "../data/catalog";
import { demoComplementFor } from "../data/complements";
import type {
  CalendarEvent,
  ComplementItem,
  OutfitItemRef,
  OutfitRecommendation,
  StyleMood,
  UserPreferences,
  WardrobeItem,
  WeatherSnapshot,
} from "../data/types";
import { conditionPhrase, isWetCondition, isWindy, weatherBand } from "../data/weather";
import { displayItemName } from "./tags";
import { canonicalizeMood, defaultMood, moodLabel, moodOverlaps, nextMood, targetFormality } from "./tpo";

/** Cold < 12°C, mild 12–22°C, warm > 22°C. Applied only when a weather snapshot exists. */
export const WEATHER_BANDS = { coldBelow: 12, warmAbove: 22 } as const;

export interface RecommendContext {
  event: CalendarEvent;
  wardrobe: WardrobeItem[];
  preferences: UserPreferences;
  mood?: StyleMood;
  formalBoost?: boolean;
  lock?: Partial<Record<WardrobeItem["category"], string>>;
  weather?: WeatherSnapshot;
}

export interface Combination {
  items: WardrobeItem[];
  score: number;
}

export interface RecommendResult {
  primary: Combination | null;
  alternative: Combination | null;
  reason: string;
  mood: StyleMood;
  incomplete: boolean;
  transparency: string;
  complement: ComplementItem | null;
  completeWithoutPurchase: boolean;
  weatherNote?: string;
  editorial: string;
}

const STYLE_TO_MOODS: Record<string, string[]> = {
  classic: ["neat", "formal"],
  sport: ["comfortable", "trendy"],
  polished: ["formal", "neat"],
  rugged: ["trendy", "neat"],
  minimal: ["neat", "comfortable"],
  statement: ["trendy", "formal"],
  leather: ["trendy", "neat"],
  denim: ["comfortable", "trendy"],
  tailored: ["neat", "formal"],
  structured: ["neat", "formal"],
  jewelry: ["neat", "trendy"],
  evening: ["formal", "neat"],
  soft: ["neat", "comfortable"],
  boxy: ["comfortable", "trendy"],
};

const FORMAL_TYPES = new Set([
  "oxford",
  "derby",
  "loafer",
  "pumps",
  "mary-jane",
  "chelsea",
  "tailored-jacket",
  "long-coat",
  "short-coat",
  "overfit-wool-coat",
  "trench-coat",
  "tote",
  "clutch",
  "silk-blouse",
  "turtleneck",
  "tapered-slacks",
  "wide-slacks",
  "pintuck-slacks",
  "midi-skirt",
  "pleated-skirt",
  "pearl-necklace",
]);

const EVENT_TYPES = new Set([
  "runner",
  "bomber",
  "backpack",
  "denim-jacket",
  "crossbody",
  "crop-tee",
  "mini-skirt",
  "bootcut-denim",
  "jogger",
  "hoodie-cotton",
  "hoodie-cashmere",
  "hood-zip",
  "sweatshirt",
]);

const COLD_TYPES = new Set([
  "long-coat",
  "short-coat",
  "boxy-coat",
  "overfit-wool-coat",
  "trench-coat",
  "short-puffer",
  "midi-down",
  "long-down",
  "daily-fur",
  "long-fur",
  "shearling",
  "leather-jacket",
  "suede-jacket",
  "tailored-jacket",
  "long-cardigan",
  "turtleneck",
  "knit-vest",
  "hoodie-cashmere",
  "cashmere-vneck",
]);

const MILD_LAYER_TYPES = new Set([
  "oversize-shirt",
  "slim-rib-knit",
  "tailored-vest",
  "short-cardigan",
  "boxy-cardigan",
  "knit-vest",
]);

const WARM_TYPES = new Set(["standard-tee", "crop-tee", "sleeveless", "bustier", "silk-blouse"]);

const CASUAL_LAYER_TYPES = new Set([
  "hoodie-cotton",
  "hoodie-cashmere",
  "hood-zip",
  "sweatshirt",
  "jogger",
]);

function objectParticle(word: string): string {
  const code = word.charCodeAt(word.length - 1);
  if (!word || code < 0xac00 || code > 0xd7a3) return "를";
  return (code - 0xac00) % 28 === 0 ? "를" : "을";
}

function catalogMeta(item: WardrobeItem) {
  const catalog = ALL_CATALOG.find((entry) => entry.id === item.catalogId || entry.name === item.name);
  return {
    formality: item.formality ?? catalog?.formality ?? 3,
    moods: item.moods ?? catalog?.moods ?? [],
    style: item.style ?? catalog?.style,
    itemType: item.itemType ?? catalog?.itemType,
    material: item.material ?? catalog?.material,
    fit: item.fit ?? catalog?.fit,
    length: item.length ?? catalog?.length,
  };
}

function scoreItem(
  item: WardrobeItem,
  ctx: RecommendContext,
  mood: StyleMood,
  target: number,
): number {
  const meta = catalogMeta(item);
  const activeMood = canonicalizeMood(mood);
  let score = 8 - Math.abs(meta.formality - target);
  if (ctx.formalBoost) {
    score += meta.formality * 1.4;
  }
  if (moodOverlaps(meta.moods, activeMood)) score += 4;
  if (ctx.preferences.stylePreferences.some((pref) => moodOverlaps(meta.moods, pref))) score += 3;
  if (ctx.preferences.avoidStyles.some((avoid) => moodOverlaps(meta.moods, avoid))) score -= 6;
  if (item.color && ctx.preferences.preferredColors.includes(item.color)) score += 1.5;
  if (meta.material && ctx.preferences.preferredColors.includes(meta.material)) score += 1.2;
  if (meta.style && moodOverlaps(STYLE_TO_MOODS[meta.style] ?? [], activeMood)) score += 1.5;
  if (meta.itemType && FORMAL_TYPES.has(meta.itemType) && (ctx.event.tpo === "work" || ctx.event.tpo === "formal_event")) {
    score += 1.8;
  }
  if (meta.itemType && EVENT_TYPES.has(meta.itemType) && (ctx.event.tpo === "concert" || ctx.event.tpo === "festival")) {
    score += 1.8;
  }
  if (ctx.weather) {
    const band = weatherBand(ctx.weather.temperatureCelsius);
    const casualTpo = ctx.event.tpo === "casual" || ctx.event.tpo === "concert" || ctx.event.tpo === "festival";
    const casualMood = activeMood === "natural_comfort" || activeMood === "city_casual";
    if (band === "cold" && meta.itemType && COLD_TYPES.has(meta.itemType)) score += 2.4;
    if (band === "mild" && meta.itemType && MILD_LAYER_TYPES.has(meta.itemType)) score += 1.6;
    if (band === "warm" && meta.itemType && WARM_TYPES.has(meta.itemType)) score += 1.8;
    if (band === "warm" && item.category === "outer") score -= 1.2;
    if (meta.itemType && CASUAL_LAYER_TYPES.has(meta.itemType)) {
      if (casualTpo && casualMood) score += 1.5;
      if (ctx.event.tpo === "work" || ctx.event.tpo === "formal_event") score -= 2;
    }
    if (isWetCondition(ctx.weather) && item.category === "outer") score += 1.2;
    if (isWindy(ctx.weather) && item.category === "outer") score += 1;
  }
  return score;
}

function activeItems(wardrobe: WardrobeItem[]) {
  return wardrobe.filter((item) => (item.status ?? "active") === "active");
}

function byCategory(wardrobe: WardrobeItem[]) {
  const map: Record<string, WardrobeItem[]> = {};
  for (const item of activeItems(wardrobe)) {
    (map[item.category] ??= []).push(item);
  }
  return map;
}

function cartesian(groups: WardrobeItem[][]): WardrobeItem[][] {
  return groups.reduce<WardrobeItem[][]>(
    (acc, group) => {
      if (group.length === 0) return acc;
      if (acc.length === 0) return group.map((item) => [item]);
      const next: WardrobeItem[][] = [];
      for (const prefix of acc) {
        for (const item of group) {
          next.push([...prefix, item]);
        }
      }
      return next;
    },
    [],
  );
}

function combinationKey(items: WardrobeItem[]): string {
  return items
    .map((item) => item.id)
    .sort()
    .join("|");
}

function applyLock(grouped: Record<string, WardrobeItem[]>, lock?: RecommendContext["lock"]) {
  if (!lock) return grouped;
  const next = { ...grouped };
  for (const [category, id] of Object.entries(lock)) {
    if (!id) continue;
    const match = (grouped[category] ?? []).filter((item) => item.id === id);
    if (match.length) next[category] = match;
  }
  return next;
}

export function buildCombinations(ctx: RecommendContext, mood: StyleMood): Combination[] {
  const grouped = applyLock(byCategory(ctx.wardrobe), ctx.lock);
  const target = targetFormality(ctx.event.tpo, ctx.event.formality);
  const required: WardrobeItem[][] = [];
  if (grouped.top?.length) required.push(grouped.top);
  const lowers = [...(grouped.bottom ?? []), ...(grouped.skirt ?? [])];
  if (lowers.length) required.push(lowers);
  if (grouped.shoes?.length) required.push(grouped.shoes);

  if (required.length === 0) return [];

  const optionals: WardrobeItem[][] = [];
  for (const category of ["outer", "bag", "accessory"] as const) {
    const list = grouped[category];
    if (list?.length) {
      optionals.push([...list]);
    }
  }

  let combos = cartesian(required);
  for (const optional of optionals) {
    const expanded: WardrobeItem[][] = [];
    for (const combo of combos) {
      expanded.push(combo);
      for (const extra of optional) {
        expanded.push([...combo, extra]);
      }
    }
    combos = expanded;
  }

  return combos
    .map((items) => ({
      items,
      score: items.reduce((sum, item) => sum + scoreItem(item, ctx, mood, target), 0) / items.length,
    }))
    .sort((a, b) => b.score - a.score);
}

function toRefs(items: WardrobeItem[]): OutfitItemRef[] {
  return items.map((item) => ({
    itemId: item.id,
    category: item.category,
    name: item.name,
    color: item.color,
  }));
}

export function editorialComment(items: WardrobeItem[]): string {
  const top = items.find((item) => item.category === "top");
  const lower = items.find((item) => item.category === "bottom" || item.category === "skirt");
  const outer = items.find((item) => item.category === "outer");
  const parts: string[] = [];
  const lowerFit = lower?.fit;
  const topStyle = top?.style;
  if (lowerFit === "wide" && top && (topStyle === "minimal" || topStyle === "classic" || top.itemType?.includes("vest"))) {
    parts.push("넉넉한 하의와 간결한 상의의 대비가 실루엣을 정돈합니다.");
  } else if (lowerFit === "straight" && top) {
    parts.push("정돈된 하의 선이 상의 실루엣을 받쳐 줍니다.");
  } else if (top && lower) {
    parts.push(`${top.name}, ${lower.name}의 비율로 일정을 맞춰 두었습니다.`);
  }
  if (outer) {
    parts.push(`${outer.name}으로 레이어를 마무리했습니다.`);
  }
  if (!parts.length) {
    return "선택한 보유 아이템의 형태와 일정 분위기를 기준으로 조합했습니다.";
  }
  return parts.join(" ");
}

export function weatherLookComment(weather?: WeatherSnapshot, items: WardrobeItem[] = []): string | undefined {
  if (!weather) return undefined;
  const band = weatherBand(weather.temperatureCelsius);
  const phrase = conditionPhrase(weather.conditionCode, weather.temperatureCelsius);
  const hasOuter = items.some((item) => item.category === "outer");
  const parts = [`${phrase}(${weather.temperatureCelsius}°C)를 참고했습니다.`];
  if (
    weather.temperatureMinCelsius != null &&
    weather.temperatureMaxCelsius != null &&
    weather.temperatureMaxCelsius - weather.temperatureMinCelsius >= 8
  ) {
    parts.push(
      `일교차 ${weather.temperatureMinCelsius}–${weather.temperatureMaxCelsius}°C가 있어 레이어를 우선했습니다.`,
    );
  }
  if (band === "cold" && !hasOuter) {
    parts.push("보유 아이템 중 가장 가까운 레이어로 맞춰 두었습니다.");
  }
  if (isWetCondition(weather)) parts.push("강수 정보가 있어 아우터를 조금 더 우선했습니다.");
  if (isWindy(weather)) parts.push("바람이 강해 레이어를 참고했습니다.");
  return parts.join(" ");
}

export function studioCoordGuide(
  weather: WeatherSnapshot | null | undefined,
  items: WardrobeItem[],
  moodLabelText?: string | null,
): string {
  const mood = moodLabelText ?? "시티 캐주얼";
  const top = items.find((item) => item.category === "top");
  const outers = items.filter((item) => item.category === "outer");
  const shoes = items.filter((item) => item.category === "shoes");
  const socks = items.filter(
    (item) => item.category === "accessory" && (item.family === "socks" || /삭스|양말/.test(item.name)),
  );
  const outer = outers.find((item) => /가디건/.test(item.name)) ?? outers[0];
  const shoe = shoes.find((item) => /스웨이드|부츠/.test(item.name)) ?? shoes[0];
  const sock = socks.find((item) => /크루/.test(item.name)) ?? socks[0];
  const topName = top ? displayItemName(top.name) : "셔츠";
  const outerName = outer ? displayItemName(outer.name) : "가벼운 아우터";
  const shoeName = shoe ? displayItemName(shoe.name) : "슈즈";
  const sockName = sock ? displayItemName(sock.name) : "";
  if (!weather) {
    return "도시를 고르면 그 지역 기온을 보고 보유 아이템으로 코디를 안내합니다.";
  }
  const band = weatherBand(weather.temperatureCelsius);
  const phrase = conditionPhrase(weather.conditionCode, weather.temperatureCelsius);
  if (band === "cold") {
    return `${phrase}, ${weather.temperatureCelsius}°C. ${outerName}, ${topName}${objectParticle(topName)} 겹쳐 입는 ${mood} 룩을 추천합니다.`;
  }
  if (band === "warm") {
    return `${phrase}, ${weather.temperatureCelsius}°C. ${topName} 중심으로 가볍게 입고, ${mood} 룩으로 연출하는 것을 추천합니다.`;
  }
  const sockPhrase = sockName ? `, ${sockName}` : "";
  return `${phrase}, ${weather.temperatureCelsius}°C. ${outerName}, ${shoeName}${sockPhrase}를 매칭하여 ${mood} 룩을 연출해보세요.`;
}

export function buildReason(
  event: CalendarEvent,
  mood: StyleMood,
  items: WardrobeItem[],
  preferences: UserPreferences,
  weather?: WeatherSnapshot,
): string {
  const names = items.map((item) => item.name).join(" · ");
  const pref = preferences.stylePreferences.map(moodLabel).join(", ");
  const prefText = pref ? `${pref} 선호와 ` : "";
  const tpoHint = event.tpo ? "일정 분위기를 함께 반영해 " : "";
  if (weather) {
    const comment = weatherLookComment(weather, items);
    return `${prefText}${tpoHint}${comment ?? ""} ${names}을(를) 조합했습니다.`;
  }
  return `${prefText}${tpoHint}${moodLabel(mood)} 방향으로 ${names}을(를) 조합했습니다.`;
}

export function recommendOutfit(ctx: RecommendContext): RecommendResult {
  const mood = canonicalizeMood(ctx.mood ?? defaultMood(ctx.event.tpo, ctx.preferences.stylePreferences));
  const combos = buildCombinations(ctx, mood);
  const primary = combos[0] ?? null;
  const alt = combos.find((combo) => combinationKey(combo.items) !== combinationKey(primary?.items ?? [])) ?? null;

  const wardrobe = activeItems(ctx.wardrobe);
  const hasTop = wardrobe.some((item) => item.category === "top");
  const hasBottom = wardrobe.some((item) => item.category === "bottom" || item.category === "skirt");
  const hasShoes = wardrobe.some((item) => item.category === "shoes");
  const hasOuter = wardrobe.some((item) => item.category === "outer");
  const incomplete = !hasTop || !hasBottom;
  let complement: ComplementItem | null = null;
  const needsFormalOuter =
    (ctx.event.tpo === "formal_event" || ctx.event.formality === "high") && !hasOuter;

  if (!hasBottom) complement = demoComplementFor("bottom") ?? null;
  else if (!hasTop) complement = demoComplementFor("top") ?? null;
  else if (!hasShoes) complement = demoComplementFor("shoes") ?? null;
  else if (needsFormalOuter) complement = demoComplementFor("outer") ?? null;

  const completeWithoutPurchase = hasTop && hasBottom && hasShoes && !needsFormalOuter;

  const transparency = incomplete
    ? "사진이 없어도 선택한 보유 아이템만으로 추천합니다. 상의와 하의가 모두 없어 조합이 제한적입니다."
    : "사진이 없어도 옷장에 표시한 보유 아이템만 추천 후보로 사용했습니다.";

  const weatherNote = ctx.weather ? weatherLookComment(ctx.weather, primary?.items ?? []) : undefined;
  const editorial = primary
    ? editorialComment(primary.items)
    : "선택한 보유 아이템만으로는 조합을 만들기 어렵습니다.";

  const reason = primary
    ? buildReason(ctx.event, mood, primary.items, ctx.preferences, ctx.weather)
    : "현재 등록된 아이템으로는 코디를 구성하기 어렵습니다. 상의와 하의를 옷장에 추가해 주세요.";

  return {
    primary,
    alternative: alt,
    reason,
    mood,
    incomplete,
    transparency,
    complement: completeWithoutPurchase ? null : complement,
    completeWithoutPurchase,
    weatherNote,
    editorial,
  };
}

export function rerollCategory(
  ctx: RecommendContext,
  current: OutfitRecommendation,
  category: "top" | "bottom",
): { combination: Combination | null; message?: string } {
  const lock: RecommendContext["lock"] = {};
  const lower = category === "bottom";
  for (const item of current.items) {
    const isLower = item.category === "bottom" || item.category === "skirt";
    if (lower ? !isLower : item.category !== category) lock[item.category] = item.itemId;
  }
  const nextCtx = { ...ctx, lock: { ...ctx.lock, ...lock } };
  const mood = current.mood ?? ctx.mood ?? defaultMood(ctx.event.tpo, ctx.preferences.stylePreferences);
  const combos = buildCombinations(nextCtx, mood).filter((combo) => {
    const match = (entry: { category: string }) =>
      category === "bottom"
        ? entry.category === "bottom" || entry.category === "skirt"
        : entry.category === category;
    const currentId = current.items.find(match)?.itemId;
    const nextId = combo.items.find(match)?.id;
    return nextId && nextId !== currentId;
  });
  if (!combos.length) {
    return {
      combination: null,
      message: "현재 등록된 아이템으로는 다른 조합을 구성하기 어렵습니다.",
    };
  }
  return { combination: combos[0] };
}

export function toRecommendation(
  eventId: string,
  combination: Combination,
  variant: OutfitRecommendation["variant"],
  reason: string,
  extras?: Partial<OutfitRecommendation>,
): OutfitRecommendation {
  return {
    id: extras?.id ?? crypto.randomUUID(),
    eventId,
    items: toRefs(combination.items),
    reason,
    variant,
    saved: extras?.saved ?? false,
    wornStatus: extras?.wornStatus ?? "unspecified",
    createdAt: extras?.createdAt ?? new Date().toISOString(),
    mood: extras?.mood,
    formalBoost: extras?.formalBoost,
  };
}

export function ownedIds(wardrobe: WardrobeItem[]): Set<string> {
  return new Set(wardrobe.map((item) => item.id));
}

export function usesOnlyOwnedItems(rec: OutfitRecommendation, wardrobe: WardrobeItem[]): boolean {
  const ids = ownedIds(wardrobe);
  return rec.items.every((item) => ids.has(item.itemId));
}

function comboIds(items: { id?: string; itemId?: string }[]): string {
  return items
    .map((item) => item.id ?? item.itemId ?? "")
    .sort()
    .join("|");
}

export function shiftMoodOutfit(
  ctx: RecommendContext,
  current: OutfitRecommendation,
):
  | { ok: true; combination: Combination; mood: StyleMood; reason: string }
  | { ok: false; combination: null; message: string } {
  let mood = nextMood(current.mood ?? ctx.mood ?? defaultMood(ctx.event.tpo, ctx.preferences.stylePreferences));
  const start = mood;
  do {
    const result = recommendOutfit({ ...ctx, mood, formalBoost: false });
    const combo = result.primary;
    if (combo && comboIds(combo.items) !== comboIds(current.items)) {
      return { ok: true, combination: combo, mood, reason: result.reason };
    }
    const alt = result.alternative;
    if (alt && comboIds(alt.items) !== comboIds(current.items)) {
      return {
        ok: true,
        combination: alt,
        mood,
        reason: buildReason(ctx.event, mood, alt.items, ctx.preferences, ctx.weather),
      };
    }
    mood = nextMood(mood);
  } while (mood !== start);
  return { ok: false, combination: null, message: "현재 등록된 아이템으로는 다른 조합을 구성하기 어렵습니다." };
}

export function moreFormalOutfit(
  ctx: RecommendContext,
  current: OutfitRecommendation,
):
  | { ok: true; combination: Combination; reason: string }
  | { ok: false; combination: null; message: string } {
  const result = recommendOutfit({ ...ctx, formalBoost: true, mood: "office_chic" });
  if (!result.primary) {
    return { ok: false, combination: null, message: "현재 등록된 아이템으로는 다른 조합을 구성하기 어렵습니다." };
  }
  const same = comboIds(result.primary.items) === comboIds(current.items);
  const combo = same && result.alternative ? result.alternative : result.primary;
  if (comboIds(combo.items) === comboIds(current.items)) {
    return { ok: false, combination: null, message: "현재 등록된 아이템으로는 다른 조합을 구성하기 어렵습니다." };
  }
  return { ok: true, combination: combo, reason: result.reason };
}

