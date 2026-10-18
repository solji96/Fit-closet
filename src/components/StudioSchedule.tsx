import { useState } from "react";
import type { CalendarEvent } from "../data/types";
import { useStore } from "../data/store";
import { tpoLabel } from "../domain/tpo";
import { EventForm } from "./EventForm";
import { Modal } from "./Modal";
import { bindRegisterPress, useRegisterPress } from "./useRegisterPress";

function formatDay(iso: string) {
  const [, month, day] = iso.split("-");
  return `${Number(month)}월 ${Number(day)}일`;
}

export function StudioSchedule({ event }: { event: CalendarEvent | null }) {
  const { dispatch } = useStore();
  const press = useRegisterPress();
  const [open, setOpen] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const date = event?.date ?? today;
  const summary = event
    ? `${formatDay(event.date)} ${tpoLabel(event.tpo)} 코디${event.placeType ? ` · ${event.placeType}` : ""}`
    : "더블클릭하거나 길게 눌러 첫 일정을 등록하세요";

  const completed = event?.scheduleStatus === "completed";
  const openRegistration = () => setOpen(true);

  return (
    <section className="studio-schedule" aria-label="Schedule Archive">
      <div className="schedule-archive-head">
        <h2 className="studio-archive-title">Schedule Archive</h2>
        <span className="schedule-hint">더블클릭 또는 길게 눌러 일정 등록</span>
      </div>
      <div
        className="schedule-card schedule-target"
        role="button"
        tabIndex={0}
        aria-label={`${summary}. 더블클릭하거나 길게 눌러 일정을 ${completed ? "수정" : "등록"}합니다.`}
        {...bindRegisterPress(press, openRegistration)}
        onKeyDown={(keyEvent) => {
          if (keyEvent.key === "Enter" || keyEvent.key === " ") {
            keyEvent.preventDefault();
            openRegistration();
          }
        }}
      >
        <div>
          <span className={completed ? "schedule-kicker is-completed" : "schedule-kicker"}>
            {completed ? "[COMPLETED · 완료]" : "[UPCOMING]"}
          </span>
          <p>{summary}</p>
        </div>
        <span className="schedule-register">{completed ? "수정하기" : "+ 등록"}</span>
      </div>
      <Modal open={open} title={completed ? "일정 수정" : "일정 등록"} onClose={() => setOpen(false)}>
        {open ? (
          <EventForm
            key={`studio-${event?.id ?? date}`}
            initial={event ?? undefined}
            defaultDate={date}
            onCancel={() => setOpen(false)}
            onSubmit={(created) => {
              const saved = { ...created, scheduleStatus: "completed" as const };
              dispatch({ type: "upsert_event", event: saved });
              dispatch({
                type: "add_notice",
                title: "일정이 완료 상태로 저장되었습니다",
                body: `${saved.date} ${saved.time} 일정을 완료로 표시하고 코디를 다시 계산했습니다.`,
                eventId: saved.id,
              });
              setOpen(false);
            }}
          />
        ) : null}
      </Modal>
    </section>
  );
}
