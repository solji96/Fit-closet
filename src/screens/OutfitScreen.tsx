import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ComplementItemCard } from "../components/ComplementItemCard";
import { InstallPrompt } from "../components/InstallPrompt";
import { Modal } from "../components/Modal";
import { NotificationPrompt } from "../components/NotificationPrompt";
import { OutfitCard } from "../components/OutfitCard";
import { StudioSchedule } from "../components/StudioSchedule";
import { KeepMarks, KeepNav } from "../components/Keeps";
import { LookOccasion } from "../components/LookOccasion";
import { Toast } from "../components/Toast";
import { usePwa } from "../pwa/usePwa";
import { useStore } from "../data/store";
import { editorialComment, recommendOutfit, studioCoordGuide, weatherLookComment } from "../domain/recommend";
import { tpoLabel } from "../domain/tpo";
import { enableOutfitReminder } from "../domain/notifications";
import { subscribeToWebPush } from "../pwa/pushSubscribe";
import { CATEGORY_LABELS, STYLE_LABELS, STYLE_OPTIONS } from "../data/catalog";
import type { ItemCategory, OutfitRecommendation, WardrobeItem } from "../data/types";
import { displayItemName, itemDisplayTags } from "../domain/tags";

const WARDROBE_ORDER: ItemCategory[] = ["top", "outer", "bottom", "skirt", "accessory", "shoes", "bag"];

type ArchiveFilter = "all" | "outer" | "top" | "bottom" | "bag" | "shoes" | "accessory";

const ARCHIVE_FILTERS: { id: ArchiveFilter; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "outer", label: "아우터" },
  { id: "top", label: "상의" },
  { id: "bottom", label: "하의" },
  { id: "bag", label: "가방" },
  { id: "shoes", label: "슈즈" },
  { id: "accessory", label: "액세서리" },
];

const ARCHIVE_GROUPS = ARCHIVE_FILTERS.filter((filter) => filter.id !== "all");

function matchesArchiveFilter(item: WardrobeItem, filter: ArchiveFilter) {
  if (filter === "all") return true;
  if (filter === "bottom") return item.category === "bottom" || item.category === "skirt";
  return item.category === filter;
}

function itemDetailLine(item: WardrobeItem): string {
  const tags = itemDisplayTags({
    color: item.color,
    colorTone: item.colorTone,
    fit: item.fit,
    style: item.style,
    material: item.material,
    styleLabel: item.style ? (STYLE_LABELS[item.style] ?? item.style) : undefined,
    fitLabel: item.fit ? (STYLE_LABELS[item.fit] ?? item.fit) : undefined,
  });
  const extra = tags.filter((tag) => tag !== item.color);
  return [item.color, ...extra].filter(Boolean).join(" · ");
}

function colorsOf(items: WardrobeItem[], match: (item: WardrobeItem) => boolean): string[] {
  const colors = new Set<string>();
  for (const item of items) {
    if (match(item) && item.color) colors.add(item.color);
  }
  return ["전체", ...colors];
}

export function OutfitScreen() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { state, dispatch, applyQuickEdit } = useStore();
  const pwa = usePwa();
  const [editError, setEditError] = useState<string | null>(null);
  const [look, setLook] = useState<"primary" | "alternative">("primary");
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notifyBusy, setNotifyBusy] = useState(false);
  const [notifyError, setNotifyError] = useState<string | null>(null);
  const [lookOpen, setLookOpen] = useState(false);
  const [archiveFilter, setArchiveFilter] = useState<ArchiveFilter>("all");
  const [topColor, setTopColor] = useState("전체");
  const [shoeColor, setShoeColor] = useState("전체");
  const [accessoryColor, setAccessoryColor] = useState("전체");
  const [openCategories, setOpenCategories] = useState<Partial<Record<ArchiveFilter, boolean>>>({});
  const [archiveOpen, setArchiveOpen] = useState(false);
  const archiveRef = useRef<HTMLElement>(null);

  const event = useMemo(() => {
    if (eventId) return state.events.find((entry) => entry.id === eventId);
    return state.events[0];
  }, [eventId, state.events]);

  useEffect(() => {
    if (event) dispatch({ type: "ensure_recommendations", eventId: event.id });
  }, [dispatch, event, state.weather, state.wardrobe]);

  useEffect(() => {
    if (event && !eventId) navigate(`/outfit/${event.id}`, { replace: true });
  }, [event, eventId, navigate]);

  const recs = state.recommendations.filter((rec) => rec.eventId === event?.id);
  const primary = recs.find((rec) => rec.variant === "primary");

  useEffect(() => {
    if (event && primary) dispatch({ type: "mark_first_outfit_seen" });
  }, [dispatch, event, primary]);
  const alternative = recs.find((rec) => rec.variant === "alternative");
  const active =
    (look === "alternative" ? alternative : primary) ?? primary ?? alternative ?? null;

  useEffect(() => {
    if (look === "alternative" && !alternative) setLook("primary");
  }, [alternative, look]);

  const insight = event
    ? recommendOutfit({
        event,
        wardrobe: state.wardrobe,
        preferences: state.preferences,
        mood: active?.mood,
        formalBoost: active?.formalBoost,
        weather: state.weather ?? undefined,
      })
    : null;

  const showBanner =
    state.firstOutfitSeen && !state.notificationBannerDismissed && !state.notificationOptIn;

  const moodOption = STYLE_OPTIONS.find((option) => option.id === state.preferences.stylePreferences[0]);
  const moodLabel = moodOption ? `${moodOption.chipLabel} (${moodOption.english})` : null;
  const wardrobeItems = useMemo(
    () =>
      state.wardrobe
        .filter((item) => item.status !== "archived")
        .sort(
          (a, b) =>
            WARDROBE_ORDER.indexOf(a.category) - WARDROBE_ORDER.indexOf(b.category) ||
            a.name.localeCompare(b.name, "ko"),
        ),
    [state.wardrobe],
  );
  const weatherGuide = state.weather
    ? studioCoordGuide(state.weather, wardrobeItems, moodOption?.chipLabel)
    : event
      ? `${tpoLabel(event.tpo)}에 맞춰 옷장 아이템으로 구성했습니다.`
      : "날씨나 상황을 고르면 옷장 아이템으로 룩을 제안합니다.";

  const resolveItems = (rec: OutfitRecommendation): WardrobeItem[] =>
    rec.items
      .map((entry) => state.wardrobe.find((item) => item.id === entry.itemId))
      .filter((item): item is WardrobeItem => Boolean(item));

  const patchRec = (rec: OutfitRecommendation, patch: Partial<OutfitRecommendation>, action: "save" | "unsave" | "worn" | "not_worn" | "select_alternative") => {
    dispatch({ type: "patch_recommendation", id: rec.id, patch });
    dispatch({
      type: "add_feedback",
      feedback: { recommendationId: rec.id, action, createdAt: new Date().toISOString() },
    });
    if (action === "save") setToast("룩북에 저장했습니다. 같은 닉네임으로 다시 불러올 수 있습니다.");
    if (action === "unsave") setToast("저장을 해제했습니다.");
    if (action === "worn") setToast("착용으로 표시했습니다.");
    if (action === "not_worn") setToast("미착용으로 표시했습니다.");
  };

  const regenerate = () => {
    if (!event) return;
    setBusy(true);
    window.setTimeout(() => {
      dispatch({ type: "refresh_recommendations", eventId: event.id });
      setBusy(false);
      setToast("룩을 다시 구성했습니다.");
    }, 180);
  };

  useEffect(() => {
    if (!archiveOpen) return;
    archiveRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [archiveOpen]);

  const wardrobeArchive = (
    <section
      id="wardrobe-archive"
      ref={archiveRef}
      className={archiveOpen ? "studio-wardrobe is-open" : "studio-wardrobe"}
      aria-label="Wardrobe Archive"
      aria-hidden={!archiveOpen}
      inert={archiveOpen ? undefined : true}
    >
      <div className="studio-wardrobe-clip">
      <div className="studio-archive-head">
        <h2 className="studio-archive-title">Wardrobe Archive ({wardrobeItems.length})</h2>
        <p className="archive-top-hint">보유한 색상은 각각 따로 표시됩니다.</p>
      </div>
      <div className="archive-accordion">
        {ARCHIVE_GROUPS.map((group) => {
          const catItems = wardrobeItems.filter((item) => matchesArchiveFilter(item, group.id));
          const isOpen = Boolean(openCategories[group.id]);
          return (
            <section key={group.id} className="archive-box">
              <button
                type="button"
                className="archive-box-toggle"
                aria-expanded={isOpen}
                onClick={() =>
                  setOpenCategories((current) => ({
                    ...current,
                    [group.id]: !current[group.id],
                  }))
                }
              >
                <span className="archive-box-title">
                  [{group.id === "top" ? "상의·레이어드" : group.label}]{" "}
                  <span className="archive-box-count">
                    ({group.id === "top" ? `${catItems.length}개 아이템` : catItems.length})
                  </span>
                </span>
                <span className="archive-box-state">{isOpen ? "▲ 닫기" : "▼ 펼치기"}</span>
              </button>
              {isOpen ? (
                <div className="archive-box-panel">
                  {catItems.length === 0 ? <p className="archive-box-empty">등록된 아이템이 없습니다.</p> : null}
                  {catItems.map((item) => {
                    const details = itemDetailLine(item);
                    return (
                      <div key={item.id} className="archive-box-row">
                        <span>{displayItemName(item.name)}</span>
                        {details ? <span className="muted">{details}</span> : null}
                        <KeepMarks entry={{ kind: "item", id: item.id, name: displayItemName(item.name), detail: item.color }} />
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
      </div>
    </section>
  );

  const topColors = useMemo(() => colorsOf(wardrobeItems, (item) => item.category === "top"), [wardrobeItems]);
  const shoeColors = useMemo(() => colorsOf(wardrobeItems, (item) => item.category === "shoes"), [wardrobeItems]);
  const accessoryColors = useMemo(
    () => colorsOf(wardrobeItems, (item) => item.category === "accessory"),
    [wardrobeItems],
  );

  const filteredItems = wardrobeItems.filter((item) => {
    if (!matchesArchiveFilter(item, archiveFilter)) return false;
    if (item.category === "top" && topColor !== "전체") return item.color === topColor;
    if (item.category === "shoes" && shoeColor !== "전체") return item.color === shoeColor;
    if (item.category === "accessory" && accessoryColor !== "전체") return item.color === accessoryColor;
    return true;
  });

  const applyLook = () => {
    regenerate();
    setLookOpen(false);
  };

  const curateModal = (
    <Modal open={lookOpen} title="룩 다시 구성" onClose={() => setLookOpen(false)}>
      <div className="stack">
        <p className="curate-label">카테고리 선택</p>
        <div className="curate-filters" role="group" aria-label="카테고리 선택">
          {ARCHIVE_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className="chip"
              aria-pressed={archiveFilter === filter.id}
              onClick={() => setArchiveFilter(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <p className="curate-label">상의 컬러</p>
        <div className="curate-filters" role="group" aria-label="상의 컬러">
          {topColors.map((color) => (
            <button
              key={`top-${color}`}
              type="button"
              className="chip"
              aria-pressed={topColor === color}
              onClick={() => setTopColor(color)}
            >
              {color}
            </button>
          ))}
        </div>
        <p className="curate-label">슈즈 컬러</p>
        <div className="curate-filters" role="group" aria-label="슈즈 컬러">
          {shoeColors.map((color) => (
            <button
              key={`shoe-${color}`}
              type="button"
              className="chip"
              aria-pressed={shoeColor === color}
              onClick={() => setShoeColor(color)}
            >
              {color}
            </button>
          ))}
        </div>
        <p className="curate-label">액세서리 컬러</p>
        <div className="curate-filters" role="group" aria-label="액세서리 컬러">
          {accessoryColors.map((color) => (
            <button
              key={`accessory-${color}`}
              type="button"
              className="chip"
              aria-pressed={accessoryColor === color}
              onClick={() => setAccessoryColor(color)}
            >
              {color}
            </button>
          ))}
        </div>
        <ul className="curate-list">
          {filteredItems.length === 0 ? <li className="muted">해당 조건의 아이템이 없습니다.</li> : null}
          {filteredItems.map((item) => {
            const details = itemDetailLine(item);
            return (
              <li key={item.id} className="curate-row">
                <span>
                  <strong>[{CATEGORY_LABELS[item.category]}]</strong>
                  {displayItemName(item.name)}
                </span>
                {details ? <span className="muted">{details}</span> : null}
              </li>
            );
          })}
        </ul>
        {busy ? <p className="helper" role="status">추천을 다시 구성하는 중</p> : null}
        <div className="row">
          <button className="btn btn-primary" type="button" onClick={applyLook} disabled={busy || !event}>
            적용 및 완료
          </button>
        </div>
      </div>
    </Modal>
  );

  const lookbook = (
    <section className="studio-lookbook" aria-label="Lookbook">
      <div className="studio-lookbook-head">
        <div>
          <p className="brand-kicker">Proposal</p>
          <h2 className="studio-title">Lookbook</h2>
          {moodLabel ? <p className="studio-mood">{moodLabel}</p> : null}
        </div>
        <div className="studio-lookbook-actions">
          <KeepNav />
          <button
            className="btn studio-archive-toggle"
            type="button"
            aria-expanded={archiveOpen}
            aria-controls="wardrobe-archive"
            onClick={() => setArchiveOpen((open) => !open)}
          >
            {archiveOpen ? "옷장 닫기" : "옷장 열기"}
          </button>
          <button className="btn btn-primary studio-rebuild" type="button" onClick={() => setLookOpen(true)} disabled={!event}>
            룩 다시 구성
          </button>
        </div>
      </div>
      {event && active ? <p className="look-proposal-note">{weatherGuide}</p> : null}
      {event && (primary || alternative) ? (
        <div className="row look-switch" role="tablist" aria-label="룩 전환">
          <button
            type="button"
            className={`chip${look === "primary" ? " is-active" : ""}`}
            role="tab"
            aria-selected={look === "primary"}
            onClick={() => setLook("primary")}
          >
            메인 룩
          </button>
          {alternative ? (
            <button
              type="button"
              className={`chip${look === "alternative" ? " is-active" : ""}`}
              role="tab"
              aria-selected={look === "alternative"}
              onClick={() => {
                setLook("alternative");
                dispatch({
                  type: "add_feedback",
                  feedback: {
                    recommendationId: alternative.id,
                    action: "select_alternative",
                    createdAt: new Date().toISOString(),
                  },
                });
              }}
            >
              얼터너티브 룩
            </button>
          ) : null}
        </div>
      ) : null}
      {event && active ? (
        <>
          <OutfitCard
            event={event}
            recommendation={active}
            wardrobe={state.wardrobe}
            title={active.variant === "alternative" ? "얼터너티브 룩" : "오늘의 코디"}
            editorial={editorialComment(resolveItems(active))}
            weatherComment={weatherLookComment(state.weather ?? undefined, resolveItems(active))}
            selected
            onSave={() => patchRec(active, { saved: !active.saved }, active.saved ? "unsave" : "save")}
            onWorn={(status) => patchRec(active, { wornStatus: status }, status)}
            onQuickEdit={(action) => {
              const result = applyQuickEdit(active, action);
              if (!result.ok) setEditError(result.message);
              else setToast("선택한 조건만 바꿔 코디를 다시 구성했습니다.");
            }}
          />
          <ComplementItemCard
            item={insight?.complement ?? null}
            completeWithoutPurchase={Boolean(insight?.completeWithoutPurchase)}
          />
        </>
      ) : (
        <p className="helper lookbook-empty">
          {event
            ? "상의와 하의를 옷장에 두면, 고른 날씨와 상황에 맞춰 룩을 제안합니다."
            : "위에서 날씨나 상황을 고르면, 옷장에 있는 아이템으로 어울리는 룩을 제안합니다."}
        </p>
      )}
    </section>
  );

  if (!event) {
    return (
      <main id="main" className="app-shell stack boutique-lounge studio-screen">
        <LookOccasion event={null} />
        {lookbook}
        <StudioSchedule event={null} />
        {wardrobeArchive}
        {curateModal}
        <Toast message={toast} onClear={() => setToast(null)} />
      </main>
    );
  }

  return (
    <main id="main" className="app-shell stack boutique-lounge studio-screen">
      <LookOccasion event={event} />
      {lookbook}
      {showBanner ? (
        <NotificationPrompt
          visible
          supported={pwa.notificationSupported}
          permission={state.notificationPermission}
          busy={notifyBusy}
          error={notifyError}
          onDismiss={() => {
            if (notifyBusy) return;
            dispatch({ type: "dismiss_notification_banner" });
            setNotifyError(null);
          }}
          onEnable={() => {
            if (notifyBusy) return;
            setNotifyBusy(true);
            setNotifyError(null);
            void enableOutfitReminder({
              supported: pwa.notificationSupported,
              permission: state.notificationPermission,
              subscribePush: subscribeToWebPush,
            })
              .then((outcome) => {
                dispatch({
                  type: "set_notification",
                  optIn: outcome.optIn,
                  permission: outcome.permission,
                  webPushEnabled: outcome.webPushEnabled,
                });
                if (outcome.notice) {
                  dispatch({
                    type: "add_notice",
                    title: outcome.notice.title,
                    body: outcome.notice.body,
                    eventId: event.id,
                  });
                }
                if (outcome.hideBanner) {
                  dispatch({ type: "dismiss_notification_banner" });
                  setToast(outcome.message);
                  setNotifyError(null);
                } else {
                  setNotifyError(outcome.message);
                }
              })
              .catch(() => {
                setNotifyError("알림 설정을 저장하지 못했습니다. 다시 시도해 주세요.");
              })
              .finally(() => {
                setNotifyBusy(false);
              });
          }}
        />
      ) : null}
      <StudioSchedule event={event} />
      {wardrobeArchive}
      {curateModal}

      <InstallPrompt
        visible={pwa.canInstall}
        onInstall={() => void pwa.install()}
        onDismiss={() => {
          pwa.dismiss();
          dispatch({ type: "dismiss_install", at: new Date().toISOString() });
        }}
      />

      <Toast message={toast} onClear={() => setToast(null)} />

      <Modal open={Boolean(editError)} title="다른 조합을 구성하기 어렵습니다" onClose={() => setEditError(null)}>
        <p>{editError}</p>
        <p className="helper">전체 코디와 설정은 그대로 두었습니다. 선택한 조건만 바꾸려다 후보가 없었습니다.</p>
        <div className="row">
          <Link className="btn btn-primary" to="/wardrobe">
            아이템 추가
          </Link>
          <button className="btn" type="button" onClick={() => setEditError(null)}>
            기존 추천으로 돌아가기
          </button>
        </div>
      </Modal>
    </main>
  );
}
