import { useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { OnboardingChecklist } from "../components/OnboardingChecklist";
import { Toast } from "../components/Toast";
import { WardrobeItemRow } from "../components/WardrobeItemRow";
import { KeepNav } from "../components/Keeps";
import { ALL_CATALOG, checklistColorMap, colorsFromChecklistIds, normalizeChecklistIds, SKIP_IDS } from "../data/catalog";
import { persistenceNote } from "../data/storage";
import { useStore } from "../data/store";
import type { ItemCategory, WardrobeItem } from "../data/types";
import { PHOTO_MAX_BYTES, PHOTO_TYPES, validatePhoto } from "../domain/validate";

const CATEGORIES: { id: ItemCategory; label: string }[] = [
  { id: "top", label: "상의" },
  { id: "bottom", label: "하의" },
  { id: "skirt", label: "스커트" },
  { id: "outer", label: "아우터" },
  { id: "shoes", label: "슈즈" },
  { id: "bag", label: "가방" },
  { id: "accessory", label: "액세서리" },
];

export function WardrobeScreen() {
  const { state, dispatch } = useStore();
  const [params] = useSearchParams();
  const fromOnboarding = params.get("from") === "onboarding";
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<WardrobeItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [shelf, setShelf] = useState<"active" | "archived">("active");
  const saveTimer = useRef<number>(0);

  const notifySaved = (message: string) => {
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => setToast(message), 280);
  };

  const checklistIds = useMemo(
    () =>
      normalizeChecklistIds([
        ...state.wardrobe.filter((item) => item.source === "checklist").map((item) => item.catalogId ?? ""),
        ...state.skippedCategories.map((category) => SKIP_IDS[category]),
      ]),
    [state.skippedCategories, state.wardrobe],
  );

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    const message = validatePhoto(file);
    if (message) {
      setError(message);
      return;
    }
    setError("");
    const url = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("read failed"));
      reader.readAsDataURL(file);
    });
    dispatch({
      type: "add_photo_item",
      item: {
        id: crypto.randomUUID(),
        category: "top",
        name: file.name.replace(/\.[^.]+$/, ""),
        source: "photo",
        imageUrl: url,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: "active",
        color: "미지정",
        itemType: "top",
        style: "minimal",
      },
    });
    setToast("사진이 이 브라우저에만 추가되었습니다. 영구 보관을 보장하지 않습니다.");
  };

  const archived = state.wardrobe.filter((item) => item.status === "archived");
  const customItems = state.wardrobe.filter((item) => item.status === "active" && item.source !== "checklist");

  return (
    <main id="main" className="app-shell stack wardrobe-atelier">
      <div className="boutique-bar">
        <p className="brand-kicker">MY CURATED WARDROBE</p>
        <KeepNav />
      </div>
      <h1>보유 아이템</h1>
      <p className="lede">{persistenceNote(state.nickname)} 사진은 이 브라우저에만 남습니다.</p>
      <div className="row shelf-tabs" role="tablist" aria-label="옷장 보기">
        <button
          type="button"
          className="chip"
          role="tab"
          aria-selected={shelf === "active"}
          onClick={() => setShelf("active")}
        >
          활성 옷장
        </button>
        <button
          type="button"
          className="chip"
          role="tab"
          aria-selected={shelf === "archived"}
          onClick={() => setShelf("archived")}
        >
          보관함
        </button>
      </div>
      {fromOnboarding ? (
        <p className="helper">
          온보딩에서 이어진 선택 단계입니다. 사진을 건너뛰고 <Link to="/outfit">첫 코디</Link>로 갈 수 있습니다.
        </p>
      ) : null}

      {shelf === "archived" ? (
        <section className="stack" aria-label="보관함">
          <div className="wardrobe-bar-list">
          {archived.map((item) => (
            <WardrobeItemRow
              key={item.id}
              item={item}
              mode="archived"
              onArchive={() => undefined}
              onRestore={() => {
                dispatch({ type: "set_wardrobe_status", id: item.id, status: "active" });
                setToast("옷장에 복원했습니다. 추천 후보에 다시 포함됩니다.");
              }}
              onRemove={
                item.source === "photo"
                  ? () => {
                      dispatch({ type: "remove_wardrobe_item", id: item.id });
                      setToast("사진 아이템을 이 기기 목록에서 삭제했습니다.");
                    }
                  : undefined
              }
            />
          ))}
          </div>
        </section>
      ) : (
      <>
      <OnboardingChecklist
        selectedIds={checklistIds}
        itemColors={checklistColorMap(state.wardrobe)}
        customItems={customItems}
        onArchiveCustom={(id) => {
          dispatch({ type: "set_wardrobe_status", id, status: "archived" });
          setToast("보관함으로 옮겼습니다. 추천에서는 빠집니다.");
        }}
        onEditCustom={(item) => setEditing(item)}
        onRemoveCustom={(id) => {
          dispatch({ type: "remove_wardrobe_item", id });
          setToast("사진 아이템을 이 기기 목록에서 삭제했습니다.");
        }}
        onChange={(ids, itemColors) => {
          const checklistIds = normalizeChecklistIds(ids);
          dispatch({ type: "set_checklist", checklistIds, itemColors });
          const paletteColors = colorsFromChecklistIds(checklistIds);
          dispatch({
            type: "update_preferences",
            preferences: {
              ...state.preferences,
              preferredColors: [...new Set([...state.preferences.preferredColors, ...paletteColors])],
            },
          });
          notifySaved("옷장 선택이 Supabase에 저장됩니다.");
        }}
      />

      <section className="card stack">
        <p className="section-kicker">OPTIONAL PHOTOS</p>
        <h2>사진 등록 (선택)</h2>
        <p className="muted">
          JPEG · PNG · WebP, 최대 {Math.round(PHOTO_MAX_BYTES / 1024 / 1024)}MB. 서버 업로드 API는 없습니다.
        </p>
        <input
          type="file"
          accept={PHOTO_TYPES.join(",")}
          onChange={(event) => void onFile(event.target.files?.[0])}
          aria-label="옷 사진 선택"
        />
        {error ? <p className="field-error">{error}</p> : null}
        <Link className="btn btn-ghost" to="/outfit">
          룩북 보기
        </Link>
      </section>

      {editing ? (
        <section className="card stack">
          <h3>아이템 정보 수정</h3>
          <label className="field">
            <span>이름</span>
            <input
              value={editing.name}
              onChange={(event) => setEditing({ ...editing, name: event.target.value })}
            />
          </label>
          <label className="field">
            <span>카테고리</span>
            <select
              value={editing.category}
              onChange={(event) => setEditing({ ...editing, category: event.target.value as ItemCategory })}
            >
              {CATEGORIES.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>색상</span>
            <input
              value={editing.color ?? ""}
              onChange={(event) => setEditing({ ...editing, color: event.target.value })}
            />
          </label>
          <label className="field">
            <span>아이템 유형</span>
            <input
              value={editing.itemType ?? ""}
              onChange={(event) => setEditing({ ...editing, itemType: event.target.value })}
            />
          </label>
          <label className="field">
            <span>스타일</span>
            <input
              value={editing.style ?? ""}
              onChange={(event) => setEditing({ ...editing, style: event.target.value })}
            />
          </label>
          <label className="field">
            <span>소재 (선택)</span>
            <input
              value={editing.material ?? ""}
              onChange={(event) => setEditing({ ...editing, material: event.target.value })}
            />
          </label>
          <div className="row">
            <button
              className="btn btn-primary"
              type="button"
              aria-label="아이템 정보 저장"
              onClick={() => {
                const catalog = ALL_CATALOG.find((entry) => entry.category === editing.category);
                dispatch({
                  type: "update_wardrobe_item",
                  item: { ...editing, formality: catalog?.formality, moods: catalog?.moods },
                });
                setEditing(null);
                setToast("아이템 정보가 Supabase에 저장됩니다. 사진은 이 브라우저에만 남습니다.");
              }}
            >
              SAVE LOOK
            </button>
            <button className="btn" type="button" onClick={() => setEditing(null)}>
              닫기
            </button>
          </div>
        </section>
      ) : null}
      </>
      )}
      <Toast message={toast} onClear={() => setToast(null)} />
    </main>
  );
}
