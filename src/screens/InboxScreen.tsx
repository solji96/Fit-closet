import { Link } from "react-router-dom";
import { useStore } from "../data/store";

export function InboxScreen() {
  const { state, dispatch } = useStore();
  return (
    <main id="main" className="app-shell stack boutique-lounge">
      <p className="brand-kicker">INBOX</p>
      <h1>앱 안 안내</h1>
      <p className="lede">
        {state.webPushEnabled
          ? "이 기기에서 브라우저 알림 구독이 저장되어 있습니다. 원격 발송은 푸시 서버가 실행될 때만 도착합니다."
          : "원격 푸시 구독이 완료되지 않았습니다. 일정에서 다음 약속을 확인하세요."}
      </p>
      <Link className="btn" to="/calendar">
        일정 화면으로 이동
      </Link>
      {state.notices.length === 0 ? null : (
        state.notices.map((notice) => (
          <article key={notice.id} className="card stack">
            <strong>{notice.title}</strong>
            <p>{notice.body}</p>
            <p className="muted">{new Date(notice.createdAt).toLocaleString("ko-KR")}</p>
            <div className="row">
              {!notice.read ? (
                <button className="btn" type="button" onClick={() => dispatch({ type: "mark_notice_read", id: notice.id })}>
                  읽음으로 표시
                </button>
              ) : (
                <span className="status-tag">읽음</span>
              )}
              {notice.eventId ? (
                <Link className="btn btn-primary" to={`/outfit/${notice.eventId}`}>
                  코디 보기
                </Link>
              ) : null}
            </div>
          </article>
        ))
      )}
    </main>
  );
}
