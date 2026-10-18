import { Link } from "react-router-dom";

interface Props {
  visible: boolean;
  supported: boolean;
  permission: NotificationPermission | "unsupported";
  busy?: boolean;
  error?: string | null;
  onEnable: () => void;
  onDismiss: () => void;
}

export function NotificationPrompt({
  visible,
  supported,
  permission,
  busy = false,
  error = null,
  onEnable,
  onDismiss,
}: Props) {
  if (!visible) return null;
  const fallback = !supported || permission === "denied" || permission === "unsupported";

  return (
    <section className="notice-strip" role="region" aria-label="알림 안내" aria-busy={busy}>
      <p className="notice-strip-copy">
        <span className="notice-strip-dot" aria-hidden="true" />
        {fallback ? "브라우저 알림 대신 알림함에서 확인할까요?" : "다음 약속 코디 알림을 받으시겠습니까?"}
      </p>
      <div className="notice-strip-actions">
        <button
          className="notice-strip-btn notice-strip-btn-primary"
          type="button"
          onClick={onEnable}
          disabled={busy}
          aria-disabled={busy}
        >
          {busy ? "설정 중" : "알림 받기"}
        </button>
        <button className="notice-strip-btn" type="button" onClick={onDismiss} disabled={busy}>
          나중에
        </button>
      </div>
      {error ? (
        <p className="notice-strip-status" role="alert">
          {error}{" "}
          <Link to="/inbox">알림함 열기</Link>
        </p>
      ) : null}
      <p className="visually-hidden" aria-live="polite">
        {busy ? "알림 설정을 처리하는 중입니다." : error ?? ""}
      </p>
    </section>
  );
}
