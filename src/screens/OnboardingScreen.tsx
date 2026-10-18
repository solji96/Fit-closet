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

  const resetDraft = () => {
    setStep(0);
    setProfileOpen(false);
    setPreferences(defaultPreferences);
    setSelectedIds([]);
    setItemColors({});
    setError("");
  };

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
    { id: 0, label: "시작" },
    { id: 1, label: "취향" },
    { id: 2, label: "옷장" },
  ] as const;
  const welcome = !signedIn && step === 0;
  const title = welcome
    ? "반가워요."
    : step === 1
      ? "어떤 무드가 좋아요?"
      : step === 2
        ? "가진 옷을 골라 주세요."
        : "좋아하는 색을 골라 주세요.";
  const lede = welcome
    ? "아래 버튼을 눌러 이름과 숫자 4자리를 정하면, 나만의 옷장이 열려요."
    : step === 1
      ? "마음에 드는 스타일을 하나 이상 고른 뒤, 아래 다음을 눌러 주세요."
      : step === 2
        ? "카테고리 상자를 누르면 옷이 펼쳐져요. 하나 이상 고른 뒤 첫 룩북을 눌러 주세요."
        : "마음에 드는 색을 누르고, 아래 다음으로 옷장에 갈 수 있어요.";

  return (
    <main id="main" className="app-shell onboarding-lounge">
      <header className="onboarding-header">
        <BoutiqueBar
          profileOpen={profileOpen}
          cueProfile={!signedIn}
          onProfile={() => setProfileOpen(true)}
          onLeave={resetDraft}
        />
        <ol className="onboarding-progress" aria-label={`${step + 1}단계, 3단계 중`}>
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
        <h1>{title}</h1>
        <p className="lede">{lede}</p>
      </header>

      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : null}

      {welcome ? (
        <section className="start-guide" aria-labelledby="start-guide-title">
          <h2 id="start-guide-title">이렇게 시작하면 돼요</h2>
          <ol className="start-steps">
            <li className="is-now">
              <span className="start-step-index">1</span>
              <span>프로필. 이름과 숫자 4자리를 정해요.</span>
            </li>
            <li>
              <span className="start-step-index">2</span>
              <span>취향. 좋아하는 색과 스타일을 골라요.</span>
            </li>
            <li>
              <span className="start-step-index">3</span>
              <span>옷장. 가진 옷을 고르면 코디가 나와요.</span>
            </li>
          </ol>
          <p className="helper">이미 옷장이 있다면, 같은 이름과 숫자 4자리로 열 수 있어요.</p>
        </section>
      ) : null}

      {step === 0 ? (
        <ColorChipGroup
          legend="좋아하는 색"
          description="지금 골라도 되고, 프로필부터 만들어도 돼요."
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
        {step === 0 && !signedIn ? (
          <button className="onboarding-next is-sentence" type="button" onClick={() => setProfileOpen(true)}>
            프로필 만들고 시작하기
          </button>
        ) : null}
        {step === 0 && signedIn ? (
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
        submitLabel="이 이름으로 시작하기"
        busyLabel="확인하고 있어요"
        onReady={() => {
          setProfileOpen(false);
          setStep(1);
        }}
        onLeave={resetDraft}
      />
    </main>
  );
}
