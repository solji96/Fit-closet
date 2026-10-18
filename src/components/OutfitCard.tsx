import { CATEGORY_LABELS, STYLE_LABELS } from "../data/catalog";
import { lookKeepId } from "../data/keeps";
import type { CalendarEvent, OutfitRecommendation, WardrobeItem } from "../data/types";
import { displayItemName, itemDisplayTags } from "../domain/tags";
import { tpoLabel } from "../domain/tpo";
import { KeepMarks } from "./Keeps";
import { QuickEditActions } from "./QuickEditActions";

interface Props {
  event: CalendarEvent;
  recommendation: OutfitRecommendation;
  wardrobe: WardrobeItem[];
  title: string;
  editorial?: string;
  weatherComment?: string;
  onSave: () => void;
  onWorn: (status: "worn" | "not_worn") => void;
  onSelect?: () => void;
  selected?: boolean;
  onQuickEdit: (action: "reroll_top" | "change_bottom" | "more_formal" | "other_mood") => void;
}

export function OutfitCard({
  event,
  recommendation,
  wardrobe,
  title,
  editorial,
  weatherComment,
  onSave,
  onWorn,
  onSelect,
  selected,
  onQuickEdit,
}: Props) {
  const lookName = recommendation.items.map((item) => displayItemName(item.name)).join(" · ") || "룩";

  return (
    <article
      className={`look-card stack${selected ? " is-selected" : ""}`}
      aria-labelledby={`outfit-${recommendation.id}`}
    >
      <div className="look-card-head">
        <div>
          <p className="brand-kicker">{title}</p>
          <h3 id={`outfit-${recommendation.id}`}>
            {event.date} {event.time} · {tpoLabel(event.tpo)}
          </h3>
        </div>
        <KeepMarks
          entry={{
            kind: "look",
            id: lookKeepId(recommendation.items.map((item) => item.itemId)),
            name: lookName,
            detail: recommendation.variant === "alternative" ? "얼터너티브 룩" : "오늘의 코디",
          }}
        />
      </div>
      {editorial ? <p className="look-editorial">{editorial}</p> : null}
      {weatherComment ? <p className="helper">{weatherComment}</p> : null}
      {!weatherComment && !editorial ? <p>{recommendation.reason}</p> : null}
      <ul className="look-items">
        {recommendation.items.map((item) => {
          const full = wardrobe.find((entry) => entry.id === item.itemId);
          const tags = full
            ? itemDisplayTags({
                color: full.color,
                colorTone: full.colorTone,
                fit: full.fit,
                style: full.style,
                material: full.material,
                styleLabel: full.style ? (STYLE_LABELS[full.style] ?? full.style) : undefined,
                fitLabel: full.fit ? (STYLE_LABELS[full.fit] ?? full.fit) : undefined,
              })
            : item.color
              ? [item.color]
              : [];
          const name = displayItemName(full?.name ?? item.name);
          return (
            <li key={item.itemId} className="look-item wardrobe-bar">
              <div className="wardrobe-bar-copy">
                <span className="look-badge">[{CATEGORY_LABELS[item.category]}]</span>
                <span className="wardrobe-bar-name">{name}</span>
                {full?.color || item.color ? (
                  <span className="wardrobe-bar-color">{full?.color ?? item.color}</span>
                ) : null}
              </div>
              {tags.length ? <span className="wardrobe-bar-details">{tags.join(" · ")}</span> : null}
              {full ? <KeepMarks entry={{ kind: "item", id: full.id, name, detail: full.color }} /> : null}
            </li>
          );
        })}
      </ul>
      <QuickEditActions onAction={onQuickEdit} />
      <div className="row">
        <button className="btn btn-primary" type="button" onClick={onSave} aria-pressed={recommendation.saved}>
          {recommendation.saved ? "저장됨" : "이 코디 저장"}
        </button>
        <button
          className="btn"
          type="button"
          onClick={() => onWorn("worn")}
          aria-pressed={recommendation.wornStatus === "worn"}
        >
          착용했어요
        </button>
        <button
          className="btn btn-ghost"
          type="button"
          onClick={() => onWorn("not_worn")}
          aria-pressed={recommendation.wornStatus === "not_worn"}
        >
          안 입었어요
        </button>
        {onSelect && !selected ? (
          <button className="btn btn-ghost" type="button" onClick={onSelect}>
            이 코디로 보기
          </button>
        ) : null}
      </div>
    </article>
  );
}
