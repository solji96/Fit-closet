import type { ReactNode } from "react";
import type { CatalogItem } from "../data/catalog";
import { displayItemName } from "../domain/tags";
import { CategoryAccordion } from "./CategoryAccordion";

interface Props {
  items: CatalogItem[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  labelledBy: string;
  legend: string;
  title: string;
  description: string;
  skipLabel?: string;
  skipped?: boolean;
  onSkip?: () => void;
  emptyLabel?: string;
  filters?: ReactNode;
  forceOpen?: boolean;
}

export function BoutiqueCatalogGrid({
  items,
  selectedIds,
  onToggle,
  labelledBy,
  legend,
  title,
  description,
  skipLabel,
  skipped,
  onSkip,
  emptyLabel,
  filters,
  forceOpen = false,
}: Props) {
  const selectedCount = items.filter((item) => selectedIds.includes(item.id)).length;

  return (
    <CategoryAccordion
      title={title}
      labelledBy={labelledBy}
      forceOpen={forceOpen}
      meta={
        <>
          {skipped ? <span className="category-accordion-skip-flag">없음</span> : null}
          {!skipped && selectedCount ? (
            <span className="filter-count" aria-label={`${selectedCount}개 선택됨`}>
              {selectedCount}
            </span>
          ) : null}
        </>
      }
    >
      <p className="section-kicker">{legend}</p>
      <p className="helper">{description}</p>
      {filters}
      {onSkip && skipLabel ? (
        <button type="button" className="chip boutique-skip" aria-pressed={Boolean(skipped)} onClick={onSkip}>
          {skipLabel}
        </button>
      ) : null}
      {items.length === 0 ? <p className="helper">{emptyLabel ?? "표시할 아이템이 없습니다."}</p> : null}
      <div className="catalog-chip-grid">
        {items.map((item) => {
          const pressed = selectedIds.includes(item.id);
          const name = displayItemName(item.name);
          return (
            <button
              key={item.id}
              type="button"
              className="catalog-chip"
              aria-pressed={pressed}
              aria-label={`${name}${pressed ? ", 선택됨" : ""}`}
              title={item.englishName ? `${name} · ${item.englishName}` : name}
              onClick={() => onToggle(item.id)}
            >
              <span className="catalog-chip-label">{name}</span>
              {pressed ? (
                <span className="catalog-chip-check" aria-hidden="true">
                  ✓
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </CategoryAccordion>
  );
}
