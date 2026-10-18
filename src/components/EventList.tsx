import { Link } from "react-router-dom";
import type { CalendarEvent, OutfitRecommendation } from "../data/types";
import { tpoLabel } from "../domain/tpo";
import { bindRegisterPress, useRegisterPress } from "./useRegisterPress";

interface Props {
  events: CalendarEvent[];
  recommendations: OutfitRecommendation[];
  onEdit: (event: CalendarEvent) => void;
  onDelete: (event: CalendarEvent) => void;
  onRegister?: (date: string) => void;
}

function statusLabel(recs: OutfitRecommendation[]): string {
  if (!recs.length) return "코디 미확인";
  if (recs.some((rec) => rec.wornStatus === "worn")) return "착용 완료";
  if (recs.some((rec) => rec.saved)) return "코디 저장됨";
  return "코디 확인됨";
}

export function EventList({ events, recommendations, onEdit, onDelete, onRegister }: Props) {
  const press = useRegisterPress();
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = [...events].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const todayEvents = upcoming.filter((event) => event.date === today);
  const later = upcoming.filter((event) => event.date > today);
  const past = upcoming.filter((event) => event.date < today);

  const renderGroup = (title: string, list: CalendarEvent[]) => (
    <section className="stack">
      <h3>{title}</h3>
      {list.length === 0 ? <p className="muted">해당하는 일정이 없습니다.</p> : null}
      {list.map((event) => {
        const recs = recommendations.filter((rec) => rec.eventId === event.id);
        return (
          <article
            key={event.id}
            className={`event-item${onRegister ? " schedule-target" : ""}`}
            {...(onRegister
              ? bindRegisterPress(press, () => onRegister(event.date), { ignoreControls: true })
              : undefined)}
          >
            <strong>
              {event.date} {event.time} · {tpoLabel(event.tpo)}
            </strong>
            <span className="status-tag">{statusLabel(recs)}</span>
            {event.placeType ? <span className="muted">{event.placeType}</span> : null}
            <div className="row">
              <Link className="btn btn-primary" to={`/outfit/${event.id}`}>
                코디 보기
              </Link>
              <button className="btn" type="button" onClick={() => onEdit(event)}>
                수정
              </button>
              <button className="btn btn-ghost" type="button" onClick={() => onDelete(event)}>
                삭제
              </button>
            </div>
          </article>
        );
      })}
    </section>
  );

  if (!events.length) {
    return (
      <p className="helper">날짜·시간·TPO를 등록하면 코디를 구성할 수 있습니다.</p>
    );
  }

  return (
    <div className="stack">
      {renderGroup("오늘", todayEvents)}
      {renderGroup("예정", later)}
      {past.length ? renderGroup("지난 일정", past) : null}
    </div>
  );
}
