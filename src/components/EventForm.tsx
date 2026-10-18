import { useState } from "react";
import type { CalendarEvent, FormalityLevel, TpoType } from "../data/types";
import { FORMALITY_OPTIONS, TPO_OPTIONS } from "../domain/tpo";
import { createEventFormValues, validateEvent, type EventFormValues } from "../domain/validate";

interface Props {
  initial?: CalendarEvent;
  defaultDate?: string;
  onSubmit: (event: CalendarEvent) => void;
  onCancel?: () => void;
}

export function EventForm({ initial, defaultDate, onSubmit, onCancel }: Props) {
  const [values, setValues] = useState<EventFormValues>(() => createEventFormValues(initial, defaultDate));
  const [errors, setErrors] = useState<ReturnType<typeof validateEvent>>({});

  const update = (patch: Partial<EventFormValues>) => {
    setValues((current) => ({ ...current, ...patch }));
  };

  return (
    <form
      className="stack"
      onSubmit={(event) => {
        event.preventDefault();
        const nextErrors = validateEvent(values);
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length) return;
        const now = new Date().toISOString();
        onSubmit({
          id: initial?.id ?? crypto.randomUUID(),
          date: values.date,
          time: values.time,
          tpo: values.tpo as TpoType,
          formality: (values.formality || undefined) as FormalityLevel | undefined,
          placeType: values.placeType || undefined,
          scheduleStatus: initial?.scheduleStatus,
          createdAt: initial?.createdAt ?? now,
          updatedAt: now,
        });
      }}
      noValidate
    >
      <label className="field">
        <span>날짜</span>
        <input
          type="date"
          value={values.date}
          onChange={(event) => update({ date: event.target.value })}
          aria-invalid={Boolean(errors.date)}
          aria-describedby={errors.date ? "event-date-error" : undefined}
          required
        />
        {errors.date ? (
          <p className="field-error" id="event-date-error" role="alert">
            {errors.date}
          </p>
        ) : null}
      </label>
      <label className="field">
        <span>시간</span>
        <input
          type="time"
          value={values.time}
          onChange={(event) => update({ time: event.target.value })}
          aria-invalid={Boolean(errors.time)}
          aria-describedby={errors.time ? "event-time-error" : undefined}
          required
        />
        {errors.time ? (
          <p className="field-error" id="event-time-error" role="alert">
            {errors.time}
          </p>
        ) : null}
      </label>
      <fieldset className="field" style={{ border: 0, padding: 0 }} aria-describedby={errors.tpo ? "event-tpo-error" : undefined}>
        <legend className="field-label">TPO</legend>
        <div className="row">
          {TPO_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className="chip"
              aria-pressed={values.tpo === option.id}
              onClick={() => update({ tpo: option.id })}
            >
              {option.label}
            </button>
          ))}
        </div>
        {errors.tpo ? (
          <p className="field-error" id="event-tpo-error" role="alert">
            {errors.tpo}
          </p>
        ) : null}
      </fieldset>
      <label className="field">
        <span>격식 수준 (선택)</span>
        <select value={values.formality} onChange={(event) => update({ formality: event.target.value })}>
          <option value="">선택 안 함</option>
          {FORMALITY_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>장소 유형 (선택)</span>
        <input
          type="text"
          placeholder="예: 오피스, 갤러리, 야외"
          value={values.placeType}
          onChange={(event) => update({ placeType: event.target.value })}
        />
      </label>
      <div className="row">
        <button className="btn btn-primary" type="submit">
          {initial ? "일정 수정 저장" : "일정 등록"}
        </button>
        {onCancel ? (
          <button className="btn btn-ghost" type="button" onClick={onCancel}>
            취소
          </button>
        ) : null}
      </div>
    </form>
  );
}
