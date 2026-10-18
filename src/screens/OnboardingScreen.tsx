import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BoutiqueBar } from "../components/BoutiqueBar";
import { ColorChipGroup } from "../components/ColorChipGroup";
import { OnboardingChecklist } from "../components/OnboardingChecklist";
import { ProfileAccess } from "../components/ProfileAccess";
import { StylePreferenceSelector } from "../components/StylePreferenceSelector";
import { checklistColorMap, colorsFromChecklistIds, normalizeChecklistIds, SKIP_IDS } from "../data/catalog";
import { defaultPreferences } from "../data/storage";
import { useStore } from "../data/store";
import type { UserPreferences } from "../data/types";

export function OnboardingScreen() {
  const { dispatch, state, signedIn } = useStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(signedIn ? 1 : 0);
  const [profileOpen, setProfileOpen] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>(
    state.preferences.stylePreferences.length ? state.preferences : defaultPreferences,
  );
  const [selectedIds, setSelectedIds] = useState(
    normalizeChecklistIds([
      ...state.wardrobe.filter((item) => item.source === "checklist").map((item) => item.catalogId ?? ""),
      ...state.skippedCategories.map((category) => SKIP_IDS[category]),
    ]),
  );
  const [itemColors, setItemColors] = useState<Record<string, string[]>>(() => checklistColorMap(state.wardrobe));
  const [error, setError] = useState("");

  const finish = (withPhotos: boolean) => {
    if (!preferences.stylePreferences.length) {
      setError("선호 스타일을 하나 이상 선택해 주세요.");
      setStep(1);
      return;
    }
    const checklistIds = normalizeChecklistIds(selectedIds.filter(Boolean));
    if (!checklistIds.length) {
      setError("상의·하의·스커트 또는 다른 보유 아이템을 하나 이상 선택해 주세요. 사진은 없어도 됩니다.");
      setStep(2);
      return;
    }
    const paletteColors = colorsFromChecklistIds(checklistIds);
    const nextPreferences: UserPreferences = {
      ...preferences,
      preferredColors: [...new Set([...preferences.preferredColors, ...paletteColors])],
    };
    dispatch({ type: "complete_onboarding", preferences: nextPreferences, checklistIds, itemColors });
    navigate(withPhotos ? "/wardrobe?from=onboarding" : "/outfit");
  };

  const steps = [
    { id: 0, label: "안내" },
    { id: 1, label: "선호" },
    { id: 2, label: "옷장" },
  ] as const;

  return (
    <main id="main" className="app-shell onboarding-lounge">
      <header className="onboarding-header">
        <BoutiqueBar
          profileOpen={profileOpen}
          cueProfile={!signedIn}
          onProfile={() => setProfileOpen(true)}
        />
        <ol className="onboarding-progress" aria-label={`온보딩 ${step + 1} / 3단계`}>
          {steps.map((entry) => (
            <li
              key={entry.id}
              className={entry.id === step ? "is-current" : entry.id < step ? "is-done" : undefined}
              aria-current={entry.id === step ? "step" : undefined}
            >
              <span className="onboarding-progress-index">{entry.id + 1}</span>
              <span>{entry.label}</span>
            </li>
          ))}
        </ol>
        <h1>옷장에서 오늘의 코디를 맞춥니다.</h1>
        <p className="lede">옷장을 고른 뒤, 오늘의 날씨와 상황을 먼저 정하면 그에 맞는 룩을 제안합니다. 사진은 나중에 추가해도 됩니다.</p>
      </header>

      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : null}

      {step === 0 ? (
        <ColorChipGroup
          legend="SELECT PALETTE"
          description="오늘의 무드에 맞는 컬러 팔레트를 선택하세요."
          labelledBy="onboarding-palette-title"
          selected={preferences.preferredColors}
          onToggle={(color) =>
            setPreferences({
              ...preferences,
              preferredColors: preferences.preferredColors.includes(color)
                ? preferences.preferredColors.filter((entry) => entry !== color)
                : [...preferences.preferredColors, color],
            })
          }
        />
      ) : null}

      {step === 1 ? (
        <StylePreferenceSelector value={preferences} onChange={setPreferences} showPalette={false} />
      ) : null}

      {step === 2 ? (
        <>
          <OnboardingChecklist
            selectedIds={selectedIds}
            itemColors={itemColors}
            onChange={(ids, colors) => {
              setSelectedIds(ids);
              setItemColors(colors);
            }}
          />
          <section className="onboarding-photo-note" aria-labelledby="onboarding-photo-title">
            <h3 id="onboarding-photo-title">사진 등록은 선택</h3>
            <p className="muted">지금은 건너뛰고, 옷장에서 나중에 추가할 수 있습니다.</p>
          </section>
        </>
      ) : null}

      <div className="onboarding-cta">
        {step === 0 ? (
          <button className="onboarding-next" type="button" onClick={() => setStep(2)}>
            다음
          </button>
        ) : null}
        {step === 1 ? (
          <button className="onboarding-next" type="button" onClick={() => setStep(2)}>
            다음
          </button>
        ) : null}
        {step === 2 ? (
          <>
            <button className="btn btn-primary" type="button" onClick={() => finish(false)} aria-label="첫 룩북 보기">
              첫 룩북 보기
            </button>
            <button className="btn btn-ghost" type="button" onClick={() => finish(false)}>
              사진 등록 건너뛰기
            </button>
            <button className="btn" type="button" onClick={() => finish(true)}>
              사진 등록하러 가기 (선택)
            </button>
          </>
        ) : null}
      </div>
      <ProfileAccess
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        submitLabel="다음"
        busyLabel="확인하고 있어요"
        onReady={() => {
          setProfileOpen(false);
          setStep(1);
        }}
      />
    </main>
  );
}
