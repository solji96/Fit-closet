import type { CatalogItem } from "../data/catalog";
import type { ItemCategory } from "../data/types";
import { displayItemName } from "../domain/tags";

export const TOP_COLORS = ["아이보리", "화이트", "블랙", "차콜", "베이지", "그레이", "레드", "핑크"];

type PickerGroup = { label: string; keys: string[] };
type Picker = { field: string; options: string[]; groups: PickerGroup[] };

const JEWELRY_COLORS = ["골드", "실버", "로즈골드", "진주"];
const FASHION_ACCESSORY_COLORS = ["블랙", "브라운", "베이지", "버건디"];
const SOCK_COLORS = ["화이트", "블랙", "멜란지그레이", "브라운", "오트밀"];
const JEWELRY_KEYS = ["earrings", "chain-necklace", "pearl-necklace", "orbital-pearl", "pendant-necklace", "chain-belt"];
const FASHION_ACCESSORY_KEYS = ["leather-belt", "long-scarf", "petit-scarf"];
const SOCK_KEYS = ["sock-crew", "sock-wool", "socks"];

const PICKERS: Record<ItemCategory, Picker> = {
  top: {
    field: "색상",
    options: TOP_COLORS,
    groups: [
      { label: "반팔·슬리브리스", keys: ["standard-tee", "crop-tee", "boxy-long-sleeve", "sleeveless"] },
      { label: "텍스처", keys: ["waffle-tee", "waffle-long-sleeve", "terry-hoodie"] },
      { label: "셔츠·블라우스", keys: ["silk-blouse", "oversize-shirt", "oxford-check", "paisley-blouse", "flower-blouse"] },
      { label: "니트·베스트", keys: ["slim-rib-knit", "cashmere-vneck", "turtleneck", "knit-vest", "tailored-vest", "bustier"] },
      { label: "후드·스웨트", keys: ["hood-zip", "hoodie-cashmere", "hoodie-cotton", "sweatshirt"] },
    ],
  },
  bottom: {
    field: "색상·워싱",
    options: ["아이보리", "블랙", "화이트", "차콜", "네이비", "베이지", "브라운", "중청", "연청", "인디고"],
    groups: [
      { label: "슬랙스", keys: ["slacks"] },
      { label: "데님", keys: ["denim"] },
      { label: "패턴", keys: ["pattern"] },
      { label: "캐주얼", keys: ["sweat"] },
      { label: "레더", keys: ["leather-pants"] },
    ],
  },
  skirt: {
    field: "색상·워싱",
    options: ["아이보리", "블랙", "화이트", "차콜", "네이비", "베이지", "브라운", "중청", "연청", "인디고"],
    groups: [
      { label: "롱·미디", keys: ["long-skirt", "midi-skirt"] },
      { label: "미니·플리츠", keys: ["mini-skirt", "pleated-skirt"] },
      { label: "스웨이드", keys: ["suede-skirt"] },
    ],
  },
  outer: {
    field: "색상",
    options: ["블랙", "베이지", "브라운", "차콜", "아이보리", "화이트", "네이비", "카멜"],
    groups: [
      { label: "재킷", keys: ["jacket"] },
      { label: "가디건", keys: ["cardigan"] },
      { label: "코트", keys: ["coat"] },
      { label: "패딩", keys: ["padding"] },
      { label: "퍼·무스탕", keys: ["fur"] },
    ],
  },
  shoes: {
    field: "색상",
    options: ["블랙", "브라운", "화이트", "베이지", "차콜"],
    groups: [
      { label: "힐·플랫", keys: ["ballet", "ballerina-heel", "satin-ballet", "tabi", "mary-jane"] },
      { label: "로퍼", keys: ["loafer"] },
      { label: "구두", keys: ["dress"] },
      { label: "스니커즈", keys: ["sneaker"] },
      { label: "부츠", keys: ["boots"] },
    ],
  },
  bag: {
    field: "색상",
    options: ["블랙", "브라운", "베이지", "화이트", "차콜"],
    groups: [
      { label: "토트·숄더", keys: ["tote", "shoulder-bag"] },
      { label: "크로스·백팩", keys: ["crossbody", "backpack"] },
      { label: "클러치·미니", keys: ["clutch", "mini-bag"] },
    ],
  },
  accessory: {
    field: "색상",
    options: FASHION_ACCESSORY_COLORS,
    groups: [
      { label: "귀걸이", keys: ["earrings"] },
      { label: "목걸이", keys: ["chain-necklace", "pearl-necklace", "orbital-pearl", "pendant-necklace"] },
      { label: "벨트", keys: ["leather-belt", "chain-belt"] },
      { label: "스카프", keys: ["long-scarf", "petit-scarf"] },
      { label: "양말", keys: ["sock-crew", "sock-wool"] },
    ],
  },
};

const TEXTURE_OPTIONS: Record<string, string[]> = {
  "waffle-tee": ["아이보리", "화이트", "블랙", "그레이", "베이지", "차콜", "핑크"],
  "waffle-long-sleeve": ["아이보리", "화이트", "블랙", "그레이", "베이지", "차콜", "핑크"],
  "terry-hoodie": ["아이보리", "오트밀", "그레이", "차콜", "베이지", "브라운", "핑크"],
};

const TOP_PATTERN_OPTIONS: Record<string, string[]> = {
  "oxford-check": ["네이비 체크", "브라운 체크", "블랙 체크", "레드 체크", "윈도우페인"],
  "paisley-blouse": ["페이즐리", "버건디 페이즐리", "네이비 페이즐리", "아이보리"],
  "flower-blouse": ["플라워", "핑크 플라워", "레드 플라워", "아이보리"],
};

const BOTTOM_PATTERN_OPTIONS: Record<string, string[]> = {
  "check-denim": ["네이비 체크", "브라운 체크", "블랙 체크", "연청", "중청"],
  "camo-denim": ["카키 카모", "블랙 카모", "인디고 카모", "워시드"],
  "washed-denim": ["라이트 워시", "미디엄 워시", "다크 워시", "애시드 워시"],
  "pattern-cotton": ["체크", "스트라이프", "카모", "페이즐리", "아이보리", "블랙", "네이비"],
};

const DENIM_WASHES = ["연청", "중청", "진청", "인디고", "원워싱", "블랙 워싱", "그레이시", "체크", "카모", "워시드"];

function fieldFor(item: CatalogItem, picker: Picker) {
  if (item.itemType && TEXTURE_OPTIONS[item.itemType]) return "색상·소재";
  if (item.itemType && (TOP_PATTERN_OPTIONS[item.itemType] || BOTTOM_PATTERN_OPTIONS[item.itemType])) return "패턴";
  if (item.category === "bottom" && item.family === "denim") return "워싱·패턴";
  return picker.field;
}

function itemKeys(item: CatalogItem) {
  return [item.family, item.itemType, item.id].filter(Boolean) as string[];
}

function optionsFor(item: CatalogItem, picker: Picker) {
  if (item.id === "accessory-earrings-gold") return ["골드", "로즈골드", "진주 세팅"];
  if (item.id === "accessory-earrings-silver") return ["실버", "진주 세팅"];
  if (item.itemType && TEXTURE_OPTIONS[item.itemType]) return TEXTURE_OPTIONS[item.itemType];
  if (item.itemType && TOP_PATTERN_OPTIONS[item.itemType]) return TOP_PATTERN_OPTIONS[item.itemType];
  if (item.itemType && BOTTOM_PATTERN_OPTIONS[item.itemType]) return BOTTOM_PATTERN_OPTIONS[item.itemType];
  if (item.category === "bottom" && item.family === "denim") return DENIM_WASHES;
  if (item.category !== "accessory") return picker.options;
  const keys = itemKeys(item);
  if (keys.some((key) => JEWELRY_KEYS.includes(key))) return JEWELRY_COLORS;
  if (keys.some((key) => SOCK_KEYS.includes(key))) return SOCK_COLORS;
  if (keys.some((key) => FASHION_ACCESSORY_KEYS.includes(key))) return FASHION_ACCESSORY_COLORS;
  return picker.options;
}

function matchesGroup(item: CatalogItem, group: PickerGroup) {
  return itemKeys(item).some((key) => group.keys.includes(key));
}

interface Props {
  category: ItemCategory;
  items: CatalogItem[];
  itemColors: Record<string, string[]>;
  onToggleColor: (id: string, color: string, checked: boolean) => void;
  expandGroups?: boolean;
}

export function TopColorList({ category, items, itemColors, onToggleColor, expandGroups = false }: Props) {
  const picker = PICKERS[category];
  if (items.length === 0) return <p className="helper">표시할 아이템이 없습니다.</p>;

  const grouped = picker.groups
    .map((group) => ({ ...group, items: items.filter((item) => matchesGroup(item, group)) }))
    .filter((group) => group.items.length > 0);
  const placed = new Set(grouped.flatMap((group) => group.items.map((item) => item.id)));
  const rest = items.filter((item) => !placed.has(item.id));
  if (rest.length) grouped.push({ label: "기타", keys: [], items: rest });

  return (
    <div className="top-subgroups">
      {grouped.map((group) => {
        const chosen = group.items.reduce((sum, item) => sum + (itemColors[item.id]?.length ?? 0), 0);
        return (
          <details
            key={`${group.label}-${expandGroups ? "open" : "closed"}`}
            className="top-subgroup"
            {...(expandGroups ? { open: true } : {})}
          >
            <summary className="top-subgroup-summary">
              <span>{group.label}</span>
              <span className="top-subgroup-meta">
                {chosen ? `${chosen}색` : `${group.items.length}`}
                <span aria-hidden="true"> ▾</span>
              </span>
            </summary>
            <ul className="top-color-list">
              {group.items.map((item) => {
                const label = fieldFor(item, picker);
                const name = displayItemName(item.name);
                const owned = itemColors[item.id] ?? [];
                const base = optionsFor(item, picker);
                const extras =
                  item.category === "accessory" ? [] : owned.filter((color) => color && !base.includes(color));
                const options = [...extras, ...base];
                return (
                  <li key={item.id} className={owned.length ? "top-color-row is-owned" : "top-color-row"}>
                    <span className="top-color-name">{name}</span>
                    <div className="color-checks" role="group" aria-label={`${name} ${label}`}>
                      {options.map((color) => {
                        const checked = owned.includes(color);
                        return (
                          <label key={color} className={checked ? "color-check is-checked" : "color-check"}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(event) => onToggleColor(item.id, color, event.target.checked)}
                            />
                            {color}
                          </label>
                        );
                      })}
                    </div>
                  </li>
                );
              })}
            </ul>
          </details>
        );
      })}
    </div>
  );
}
