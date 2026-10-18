import { useMemo, useState } from "react";
import { CategoryAccordion } from "./CategoryAccordion";
import { TopColorList } from "./TopColorList";
import { WardrobeItemRow } from "./WardrobeItemRow";
import { catalogByCategory, catalogIdCategory, normalizeChecklistIds, SKIP_IDS } from "../data/catalog";
import type { CatalogItem } from "../data/catalog";
import type { WardrobeItem } from "../data/types";

interface Props {
  selectedIds: string[];
  itemColors?: Record<string, string[]>;
  customItems?: WardrobeItem[];
  onArchiveCustom?: (id: string) => void;
  onEditCustom?: (item: WardrobeItem) => void;
  onRemoveCustom?: (id: string) => void;
  onChange: (ids: string[], itemColors: Record<string, string[]>) => void;
}

function matchesQuery(item: CatalogItem, query: string): boolean {
  if (!query) return true;
  const haystack = `${item.name} ${item.englishName ?? ""} ${item.itemType ?? ""} ${item.style ?? ""}`.toLowerCase();
  return haystack.includes(query);
}

export function OnboardingChecklist({
  selectedIds,
  itemColors = {},
  customItems = [],
  onArchiveCustom,
  onEditCustom,
  onRemoveCustom,
  onChange,
}: Props) {
  const ids = normalizeChecklistIds(selectedIds);
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();

  const groups = useMemo(
    () =>
      (
        [
          {
            category: "top" as const,
            labelledBy: "select-tops",
            title: "상의·레이어드",
            description: "같은 옷도 가진 색을 모두 체크해 주세요.",
          },
          {
            category: "bottom" as const,
            labelledBy: "select-bottoms",
            title: "하의",
            description: "같은 하의도 가진 색·워싱을 모두 체크해 주세요.",
          },
          {
            category: "skirt" as const,
            labelledBy: "select-skirts",
            title: "스커트",
            description: "같은 스커트도 가진 색·워싱을 모두 체크해 주세요.",
          },
          {
            category: "outer" as const,
            labelledBy: "select-outer",
            title: "아우터",
            description: "같은 아우터도 가진 색을 모두 체크해 주세요.",
          },
          {
            category: "shoes" as const,
            labelledBy: "select-shoes",
            title: "신발",
            description: "같은 신발도 가진 색을 모두 체크해 주세요.",
          },
          {
            category: "bag" as const,
            labelledBy: "select-bags",
            title: "가방",
            description: "같은 가방도 가진 색을 모두 체크해 주세요.",
          },
          {
            category: "accessory" as const,
            labelledBy: "select-accessories",
            title: "액세서리",
            description: "귀걸이, 목걸이, 양말도 가진 색을 모두 체크해 주세요.",
          },
        ] as const
      ).map((group) => ({
        ...group,
        items: catalogByCategory(group.category).filter((item) => matchesQuery(item, normalizedQuery)),
      })),
    [normalizedQuery],
  );

  const commit = (next: string[], colors: Record<string, string[]> = itemColors) =>
    onChange(normalizeChecklistIds(next), colors);

  const toggleItemColor = (id: string, color: string, checked: boolean) => {
    const current = itemColors[id] ?? [];
    const nextColors = checked
      ? current.includes(color)
        ? current
        : [...current, color]
      : current.filter((entry) => entry !== color);
    const colors = { ...itemColors };
    if (nextColors.length) colors[id] = nextColors;
    else delete colors[id];
    let next = ids;
    if (nextColors.length) {
      if (!next.includes(id)) next = [...next, id];
      const category = catalogIdCategory(id);
      if (category === "bag") next = next.filter((entry) => entry !== SKIP_IDS.bag);
      if (category === "accessory") next = next.filter((entry) => entry !== SKIP_IDS.accessory);
    } else {
      next = next.filter((entry) => entry !== id);
    }
    commit(next, colors);
  };

  const skipCategory = (category: "bag" | "accessory") => {
    const skipId = SKIP_IDS[category];
    const without = ids.filter((id) => catalogIdCategory(id) !== category && id !== skipId);
    const colors = { ...itemColors };
    for (const id of Object.keys(colors)) {
      if (catalogIdCategory(id) === category) delete colors[id];
    }
    commit([...without, skipId], colors);
  };

  return (
    <div className="stack wardrobe-editor">
      <label className="field wardrobe-search">
        <span>아이템 검색</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="실루엣, 한글 또는 영문 이름"
          aria-label="옷장 아이템 검색"
        />
      </label>
      {groups.map((group) => {
        const chosen = group.items.reduce((sum, item) => sum + (itemColors[item.id]?.length ?? 0), 0);
        const skipped = group.category === "bag" ? ids.includes(SKIP_IDS.bag) : group.category === "accessory" ? ids.includes(SKIP_IDS.accessory) : false;
        return (
          <CategoryAccordion
            key={group.category}
            title={group.title}
            labelledBy={group.labelledBy}
            forceOpen={Boolean(normalizedQuery) && group.items.length > 0}
            meta={
              skipped ? (
                <span className="category-accordion-skip-flag">없음</span>
              ) : chosen ? (
                <span className="filter-count" aria-label={`${chosen}색 소장`}>
                  {chosen}
                </span>
              ) : null
            }
          >
            <p className="helper">{group.description}</p>
            {group.category === "bag" || group.category === "accessory" ? (
              <button
                type="button"
                className="catalog-skip"
                aria-pressed={skipped}
                onClick={() => skipCategory(group.category as "bag" | "accessory")}
              >
                {group.category === "bag" ? "보유한 항목 없음" : "건너뛰기"}
              </button>
            ) : null}
            <TopColorList
              category={group.category}
              items={group.items}
              itemColors={itemColors}
              onToggleColor={toggleItemColor}
              expandGroups={Boolean(normalizedQuery)}
            />
            {customItems.filter((item) => item.category === group.category).length ? (
              <div className="wardrobe-bar-list">
                {customItems
                  .filter((item) => item.category === group.category)
                  .map((item) => (
                    <WardrobeItemRow
                      key={item.id}
                      item={item}
                      mode="active"
                      onArchive={() => onArchiveCustom?.(item.id)}
                      onRestore={() => undefined}
                      onEdit={onEditCustom ? () => onEditCustom(item) : undefined}
                      onRemove={onRemoveCustom ? () => onRemoveCustom(item.id) : undefined}
                    />
                  ))}
              </div>
            ) : null}
          </CategoryAccordion>
        );
      })}
    </div>
  );
}
