import type { TpoType } from "../data/types";
import { TPO_OPTIONS } from "./tpo";

export interface EventFormValues {
  date: string;
  time: string;
  tpo: TpoType | "";
  formality: string;
  placeType: string;
}

export function createEventFormValues(
  initial?: { date?: string; time?: string; tpo?: TpoType | ""; formality?: string; placeType?: string },
  defaultDate?: string,
): EventFormValues {
  return {
    date: initial?.date || defaultDate || "",
    time: initial?.time ?? "",
    tpo: initial?.tpo ?? "",
    formality: initial?.formality ?? "",
    placeType: initial?.placeType ?? "",
  };
}

export type EventFormErrors = Partial<Record<keyof EventFormValues, string>>;

export function validateEvent(values: EventFormValues): EventFormErrors {
  const errors: EventFormErrors = {};
  if (!values.date) {
    errors.date = "약속 날짜를 선택해 주세요.";
  }
  if (!values.time) {
    errors.time = "시간을 입력해 주세요.";
  }
  if (!values.tpo || !TPO_OPTIONS.some((option) => option.id === values.tpo)) {
    errors.tpo = "TPO 유형을 선택해 주세요.";
  }
  return errors;
}

export const PHOTO_MAX_BYTES = 2 * 1024 * 1024;
export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function validatePhoto(file: File): string | null {
  if (!PHOTO_TYPES.includes(file.type)) {
    return "JPEG, PNG, WebP 이미지만 등록할 수 있습니다.";
  }
  if (file.size > PHOTO_MAX_BYTES) {
    return "파일 용량은 2MB 이하여야 합니다. 이 기기에만 임시로 저장됩니다.";
  }
  return null;
}
