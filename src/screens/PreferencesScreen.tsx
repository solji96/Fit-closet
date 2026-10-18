import { useState } from "react";
import { LeaveClosetButton } from "../components/BoutiqueBar";
import { StylePreferenceSelector } from "../components/StylePreferenceSelector";
import { Toast } from "../components/Toast";
import { useStore } from "../data/store";

export function PreferencesScreen() {
  const { state, dispatch } = useStore();
  const [draft, setDraft] = useState(state.preferences);
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState("");

  return (
    <main id="main" className="app-shell stack boutique-lounge">
      <p className="brand-kicker">PREFERENCES</p>
      <h1>선택 사항 수정</h1>
      <p className="helper">닉네임 {state.nickname}</p>
      <p className="lede">저장하면 이후 추천 방향에만 반영되고, 이미 만든 일정을 지우지는 않습니다.</p>
      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : null}
      {saved ? (
        <p className="helper" role="status">
          선호가 Supabase에 저장됩니다. 다음 코디 계산부터 반영됩니다.
        </p>
      ) : null}
      <StylePreferenceSelector value={draft} onChange={setDraft} />
      <button
        className="btn btn-primary"
        type="button"
        onClick={() => {
          if (!draft.stylePreferences.length) {
            setError("선호 스타일을 하나 이상 선택해 주세요.");
            setSaved(false);
            return;
          }
          setError("");
          dispatch({ type: "update_preferences", preferences: draft });
          setSaved(true);
          setToast("선호가 Supabase에 저장됩니다. 다음 코디부터 반영됩니다.");
        }}
      >
        선호 저장
      </button>
      <LeaveClosetButton />
      <Toast message={toast} onClear={() => setToast(null)} />
    </main>
  );
}
