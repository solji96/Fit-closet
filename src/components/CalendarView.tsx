import { useEffect, useState } from "react";
import type { CalendarEvent } from "../data/types";
import { bindRegisterPress, useRegisterPress } from "./useRegisterPress";

interface Props {
  events: CalendarEvent[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  onCreateForDate?: (date: string) => void;
}

function startOfMonth(year: number, month: number) {
  return new Date(year, month, 1);
}

function toIsoDate(year: number, monthIndex: number, day: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function CalendarView({ events, selectedDate, onSelectDate, onCreateForDate }: Props) {
  const press = useRegisterPress();
  const today = new Date().toISOString().slice(0, 10);
  const [cursor, setCursor] = useState(selectedDate ?? today);
  useEffect(() => {
    if (selectedDate) setCursor(selectedDate);
  }, [selectedDate]);
  const anchor = new Date(`${cursor}T00:00:00`);
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const first = startOfMonth(year, month);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<{ date: string | null; day: number | null }> = [];
  for (let i = 0; i < startWeekday; i += 1) cells.push({ date: null, day: null });
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = toIsoDate(year, month, day);
    cells.push({ date, day });
  }

  const counts = events.reduce<Record<string, number>>((acc, event) => {
    acc[event.date] = (acc[event.date] ?? 0) + 1;
    return acc;
  }, {});

  const shiftMonth = (delta: number) => {
    const next = new Date(year, month + delta, 1);
    setCursor(toIsoDate(next.getFullYear(), next.getMonth(), 1));
  };

  return (
    <section className="card stack" aria-label="월간 캘린더">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <button className="btn" type="button" onClick={() => shiftMonth(-1)} aria-label="이전 달">
          이전
        </button>
        <h2>
          {year}년 {month + 1}월
        </h2>
        <button className="btn" type="button" onClick={() => shiftMonth(1)} aria-label="다음 달">
          다음
        </button>
      </div>
      <div className="calendar-weekdays" aria-hidden="true">
        {["일", "월", "화", "수", "목", "금", "토"].map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className="calendar-grid" role="grid" aria-label={`${year}년 ${month + 1}월`}>
        {cells.map((cell, index) => {
          if (!cell.date || !cell.day) {
            return <div key={`empty-${index}`} className="calendar-day is-empty" />;
          }
          const date = cell.date;
          const hasEvent = Boolean(counts[date]);
          const isToday = date === today;
          const isSelected = date === selectedDate;
          return (
            <button
              key={date}
              type="button"
              className={`calendar-day schedule-target${hasEvent ? " has-event" : ""}${isToday ? " is-today" : ""}${isSelected ? " is-selected" : ""}`}
              aria-pressed={isSelected}
              aria-label={`${date}${hasEvent ? `, 일정 ${counts[date]}건` : ""}${isToday ? ", 오늘" : ""}`}
              onClick={() => onSelectDate(date)}
              {...bindRegisterPress(press, () => {
                onSelectDate(date);
                onCreateForDate?.(date);
              })}
            >
              <span>{cell.day}</span>
              {hasEvent ? <span className="calendar-dot" aria-hidden="true" /> : null}
            </button>
          );
        })}
      </div>
      <p className="helper">날짜를 누르면 그날만 봅니다. 더블클릭하거나 길게 누르면 일정 등록 창이 열립니다.</p>
    </section>
  );
}
