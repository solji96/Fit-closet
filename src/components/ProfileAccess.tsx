import { useEffect, useId, useRef, useState } from "react";
import { isPin, normalizePin } from "../data/pin";
import { useStore } from "../data/store";
import { PersonIcon } from "./BoutiqueBar";

interface Props {
  open: boolean;
  onClose: () => void;
  submitLabel: string;
  busyLabel: string;
  onReady: (result: "created" | "unlocked") => void;
}

export function ProfileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="line-icon"
        type="button"
        aria-label="프로필"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <PersonIcon />
      </button>
      <ProfileAccess
        open={open}
        onClose={() => setOpen(false)}
        submitLabel="옷장 열기"
        busyLabel="확인하고 있어요"
        onReady={() => setOpen(false)}
      />
    </>
  );
}

export function ProfileAccess({ open, onClose, submitLabel, busyLabel, onReady }: Props) {
  const { state, signedIn, profileExists, openWithPin, signOut } = useStore();
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [nickname, setNickname] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [promptPin, setPromptPin] = useState("");
  const [promptError, setPromptError] = useState("");
  const [pendingName, setPendingName] = useState("");

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose, busy]);

  if (!open) return null;

  const unlock = async (name: string, code: string) => {
    const result = await openWithPin(name, code);
    if (result === "created" || result === "unlocked") {
      setPendingName("");
      onReady(result);
      return;
    }
    if (result === "locked") {
      setPromptError("잠시 후 다시 시도해 주세요. 옷장을 안전하게 지켜 두고 있어요.");
      return;
    }
    if (result === "invalid_pin") {
      setPromptError("숫자 4자리가 맞지 않아요. 다시 한번 입력해 주세요.");
      return;
    }
    setError("옷장을 열지 못했어요. 연결을 확인한 뒤 다시 시도해 주세요.");
  };

  const submit = async () => {
    const name = nickname.trim();
    if (!name) {
      setError("이름을 입력해 주세요.");
      return;
    }
    if (name.length > 24) {
      setError("이름은 24자까지 입력할 수 있어요.");
      return;
    }
    if (!isPin(pin)) {
      setError("숫자 4자리를 입력해 주세요.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const exists = await profileExists(name);
      if (exists) {
        setPendingName(name);
        setPromptPin("");
        setPromptError("");
        return;
      }
      await unlock(name, pin);
    } catch {
      setError("옷장을 열지 못했어요. 연결을 확인한 뒤 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  };

  const confirmPin = async () => {
    if (!isPin(promptPin)) {
      setPromptError("숫자 4자리를 입력해 주세요.");
      return;
    }
    setBusy(true);
    setPromptError("");
    try {
      await unlock(pendingName, promptPin);
    } catch {
      setPromptError("옷장을 열지 못했어요. 연결을 확인한 뒤 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  };

  const close = () => {
    if (!busy) onClose();
  };

  return (
    <div className="profile-backdrop" onClick={close}>
      <aside
        className="profile-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="profile-sheet-top">
          <p className="brand-kicker">PROFILE</p>
          <button ref={closeRef} className="line-icon sheet-close" type="button" aria-label="닫기" onClick={close}>
            <CloseIcon />
          </button>
        </div>

        {signedIn ? (
          <>
            <h2 id={titleId}>옷장이 열려 있어요</h2>
            <p className="lede">{state.nickname ? `${state.nickname}님` : "프로필"}</p>
            <p className="profile-note">이 기기의 기억만 지워요. 다른 이름과 숫자 4자리로 다시 열 수 있어요.</p>
            <button
              className="profile-submit profile-leave"
              type="button"
              onClick={() => {
                signOut();
                onClose();
              }}
            >
              옷장 나가기
            </button>
            <button className="profile-submit" type="button" onClick={close}>
              닫기
            </button>
          </>
        ) : pendingName ? (
          <>
            <h2 id={titleId}>이 이름은 이미 옷장이 있어요</h2>
            <p className="lede">만들 때 정한 숫자 4자리를 입력해 주세요.</p>
            <label className="field">
              <span>숫자 4자리</span>
              <input
                className="profile-field pin-input"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                maxLength={4}
                value={promptPin}
                placeholder="••••"
                aria-label="기존 옷장의 숫자 4자리"
                onChange={(event) => setPromptPin(normalizePin(event.target.value))}
              />
            </label>
            {promptError ? (
              <p className="field-error" role="alert">
                {promptError}
              </p>
            ) : null}
            <button className="profile-submit" type="button" disabled={busy} onClick={() => void confirmPin()}>
              {busy ? "확인하고 있어요" : "옷장 열기"}
            </button>
          </>
        ) : (
          <>
            <h2 id={titleId}>옷장을 열어 볼게요</h2>
            <p className="lede">부를 이름과 숫자 4자리만 정하면 돼요.</p>
            <label className="field">
              <span>이름</span>
              <input
                className="profile-field"
                value={nickname}
                maxLength={24}
                autoComplete="nickname"
                placeholder="예: 치치"
                onChange={(event) => setNickname(event.target.value)}
              />
            </label>
            <label className="field">
              <span>숫자 4자리</span>
              <input
                className="profile-field pin-input"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                maxLength={4}
                value={pin}
                placeholder="••••"
                aria-label="숫자 4자리"
                onChange={(event) => setPin(normalizePin(event.target.value))}
              />
            </label>
            <div className="profile-notes">
              <p className="profile-note">이 폰에서는 한 번 열면, 다음부터 바로 들어와요.</p>
              <p className="profile-note">다른 기기에서는 같은 이름과 숫자 4자리로 다시 열 수 있어요.</p>
            </div>
            {error ? (
              <p className="field-error" role="alert">
                {error}
              </p>
            ) : null}
            <button className="profile-submit" type="button" disabled={busy} onClick={() => void submit()}>
              {busy ? busyLabel : submitLabel}
            </button>
          </>
        )}
      </aside>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 7l10 10M17 7L7 17" />
    </svg>
  );
}
