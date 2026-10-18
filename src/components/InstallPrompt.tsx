interface Props {
  visible: boolean;
  onInstall: () => void;
  onDismiss: () => void;
}

export function InstallPrompt({ visible, onInstall, onDismiss }: Props) {
  if (!visible) return null;
  return (
    <section className="banner" role="region" aria-label="앱 설치">
      <strong>홈 화면에 두고 쓰시겠어요?</strong>
      <p className="muted">이 안내는 설치가 가능한 브라우저에서만 나타납니다. 닫으면 당분간 다시 보이지 않습니다.</p>
      <div className="row">
        <button className="btn btn-primary" type="button" onClick={onInstall}>
          설치하기
        </button>
        <button className="btn btn-ghost" type="button" onClick={onDismiss}>
          닫기
        </button>
      </div>
    </section>
  );
}
