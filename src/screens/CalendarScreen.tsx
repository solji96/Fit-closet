import { useMemo, useState } from "react";
import { CalendarView } from "../components/CalendarView";
import { EventForm } from "../components/EventForm";
import { EventList } from "../components/EventList";
import { WeatherWidget } from "../components/WeatherWidget";
import { Modal } from "../components/Modal";
import { persistenceNote } from "../data/storage";
import { useStore } from "../data/store";
import type { CalendarEvent } from "../data/types";

export function CalendarScreen() {
  const { state, dispatch } = useStore();
  const [editing, setEditing] = useState<CalendarEvent | "new" | null>(null);
  const [confirm, setConfirm] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [draftDate, setDraftDate] = useState<string | undefined>();

  const visibleEvents = useMemo(
    () => (selectedDate ? state.events.filter((event) => event.date === selectedDate) : state.events),
    [selectedDate, state.events],
  );

  const openRegistration = (date?: string) => {
    if (date) setSelectedDate(date);
    setDraftDate(date ?? selectedDate ?? undefined);
    setEditing("new");
  };

  return (
    <main id="main" className="app-shell stack boutique-lounge">
      <p className="brand-kicker">캘린더</p>
      <h1>오늘과 예정 약속</h1>
      <p className="lede">{persistenceNote(state.nickname)}</p>
      <WeatherWidget />
      <button
        className="btn btn-primary"
        type="button"
        onClick={() => openRegistration()}
      >
        일정 등록
      </button>
      <CalendarView
        events={state.events}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        onCreateForDate={openRegistration}
      />
      {selectedDate ? (
        <p className="helper" role="status">
          {selectedDate} 일정만 보고 있습니다.
        </p>
      ) : null}
      <EventList
        events={visibleEvents}
        recommendations={state.recommendations}
        onEdit={setEditing}
        onDelete={setConfirm}
        onRegister={openRegistration}
      />
      <Modal open={Boolean(editing)} title={editing === "new" ? "일정 등록" : "일정 수정"} onClose={() => setEditing(null)}>
        {editing ? (
          <EventForm
            key={editing === "new" ? `new-${draftDate ?? "blank"}` : editing.id}
            initial={editing === "new" ? undefined : editing}
            defaultDate={editing === "new" ? draftDate : undefined}
            onCancel={() => setEditing(null)}
            onSubmit={(event) => {
              dispatch({ type: "upsert_event", event });
              dispatch({
                type: "add_notice",
                title: "일정이 반영되었습니다",
                body: `${event.date} ${event.time} 일정의 코디를 다시 계산했습니다. 원격 알림은 보내지 않았습니다.`,
                eventId: event.id,
              });
              setEditing(null);
            }}
          />
        ) : null}
      </Modal>
      <Modal open={Boolean(confirm)} title="일정을 삭제할까요?" onClose={() => setConfirm(null)}>
        <p>연결된 코디 기록도 이 기기에서 함께 사라집니다. 서버에서 삭제되는 것은 아닙니다.</p>
        <div className="row">
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => {
              if (confirm) dispatch({ type: "delete_event", id: confirm.id });
              setConfirm(null);
            }}
          >
            삭제
          </button>
          <button className="btn" type="button" onClick={() => setConfirm(null)}>
            돌아가기
          </button>
        </div>
      </Modal>
    </main>
  );
}
