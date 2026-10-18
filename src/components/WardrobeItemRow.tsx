import { useEffect, useRef, useState } from "react";
import { CATEGORY_LABELS, STYLE_LABELS } from "../data/catalog";
import type { WardrobeItem } from "../data/types";
import { displayItemName, itemDisplayTags } from "../domain/tags";
import { KeepMarks } from "./Keeps";

interface Props {
  item: WardrobeItem;
  mode: "active" | "archived";
  onArchive: () => void;
  onRestore: () => void;
  onEdit?: () => void;
  onRemove?: () => void;
}

export function WardrobeItemRow({ item, mode, onArchive, onRestore, onEdit, onRemove }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [offset, setOffset] = useState(0);
  const startX = useRef<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const tags = itemDisplayTags({
    color: item.color,
    colorTone: item.colorTone,
    fit: item.fit,
    style: item.style,
    material: item.material,
    styleLabel: item.style ? (STYLE_LABELS[item.style] ?? item.style) : undefined,
    fitLabel: item.fit ? (STYLE_LABELS[item.fit] ?? item.fit) : undefined,
  });

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  const label = displayItemName(item.name);

  return (
    <article
      className="wardrobe-bar"
      onTouchStart={(event) => {
        startX.current = event.changedTouches[0]?.clientX ?? null;
      }}
      onTouchMove={(event) => {
        if (startX.current == null) return;
        const dx = (event.changedTouches[0]?.clientX ?? startX.current) - startX.current;
        if (mode === "active") setOffset(Math.min(0, Math.max(-72, dx)));
      }}
      onTouchEnd={() => {
        if (offset < -48 && mode === "active") onArchive();
        setOffset(0);
        startX.current = null;
      }}
      style={{ transform: offset ? `translateX(${offset}px)` : undefined }}
    >
      <div className="wardrobe-bar-copy" title={tags.length ? tags.join(" · ") : undefined}>
        <span className="look-badge">[{CATEGORY_LABELS[item.category]}]</span>
        <span className="wardrobe-bar-name">{label}</span>
        {item.color ? <span className="wardrobe-bar-color">{item.color}</span> : null}
      </div>
      <div className="wardrobe-bar-meta" ref={menuRef}>
        {tags.length ? <span className="wardrobe-bar-details">{tags.join(" · ")}</span> : null}
        <KeepMarks entry={{ kind: "item", id: item.id, name: label, detail: item.color }} />
        <button
          type="button"
          className="icon-btn menu-btn"
          aria-label={`${displayItemName(item.name)} 메뉴`}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          ···
        </button>
        {menuOpen ? (
          <div className="item-menu" role="menu">
            {mode === "active" ? (
              <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); onArchive(); }}>
                보관함으로 옮기기
              </button>
            ) : (
              <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); onRestore(); }}>
                옷장에 복원
              </button>
            )}
            {onEdit ? (
              <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); onEdit(); }}>
                정보 수정
              </button>
            ) : null}
            {onRemove ? (
              <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); onRemove(); }}>
                목록에서 삭제
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
