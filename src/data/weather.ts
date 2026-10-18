import type { WeatherSnapshot } from "./types";

export type WeatherBand = "cold" | "mild" | "warm";
export type { WeatherSnapshot };

export interface WeatherQueryResult {
  ok: true;
  snapshot: WeatherSnapshot;
}

export interface WeatherQueryFailure {
  ok: false;
  reason: "denied" | "unsupported" | "timeout" | "error";
  message: string;
}

export const MANUAL_CITIES: { id: string; label: string; latitude: number; longitude: number }[] = [
  { id: "seoul", label: "서울", latitude: 37.5665, longitude: 126.978 },
  { id: "gwangmyeong", label: "광명", latitude: 37.4786, longitude: 126.8646 },
  { id: "hwaseong", label: "화성", latitude: 37.1995, longitude: 126.8312 },
  { id: "busan", label: "부산", latitude: 35.1796, longitude: 129.0756 },
  { id: "incheon", label: "인천", latitude: 37.4563, longitude: 126.7052 },
  { id: "daegu", label: "대구", latitude: 35.8714, longitude: 128.6014 },
  { id: "daejeon", label: "대전", latitude: 36.3504, longitude: 127.3845 },
  { id: "gwangju", label: "광주", latitude: 35.1595, longitude: 126.8526 },
  { id: "jeju", label: "제주", latitude: 33.4996, longitude: 126.5312 },
];

/** WMO weather interpretation used by Open-Meteo. */
export function conditionPhrase(code: number | undefined, temperatureCelsius: number): string {
  const band = weatherBand(temperatureCelsius);
  const cool = band === "cold" ? "쌀쌀해요" : band === "mild" ? "선선해요" : "따뜻해요";
  if (code == null) return cool;
  if (code === 0) return band === "cold" ? "맑고 쌀쌀해요" : band === "warm" ? "맑고 따뜻해요" : "선선한 날씨";
  if (code === 1 || code === 2) return band === "cold" ? "구름 조금, 쌀쌀해요" : "구름 조금, 선선해요";
  if (code === 3) return band === "cold" ? "흐리고 쌀쌀해요" : "흐린 날씨";
  if (code === 45 || code === 48) return "안개가 있어요";
  if (code >= 51 && code <= 57) return "이슬비가 내려요";
  if (code >= 61 && code <= 67) return "비가 와요";
  if (code >= 71 && code <= 77) return "눈이 와요";
  if (code >= 80 && code <= 82) return "소나기가 있어요";
  if (code >= 85 && code <= 86) return "눈발이 있어요";
  if (code >= 95 && code <= 99) return "뇌우가 있어요";
  return cool;
}

export function weatherBand(temperatureCelsius: number): WeatherBand {
  if (temperatureCelsius < 12) return "cold";
  if (temperatureCelsius <= 22) return "mild";
  return "warm";
}

export function isWetCondition(snapshot: WeatherSnapshot): boolean {
  if ((snapshot.precipitationMm ?? 0) > 0.2) return true;
  const code = snapshot.conditionCode ?? -1;
  return (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || (code >= 95 && code <= 99);
}

export function isWindy(snapshot: WeatherSnapshot): boolean {
  return (snapshot.windSpeedKmh ?? 0) >= 25;
}

export function formatFetchedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

async function reverseLabel(latitude: number, longitude: number): Promise<string | undefined> {
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&language=ko&format=json`;
    const response = await fetch(url);
    if (!response.ok) return undefined;
    const data = (await response.json()) as {
      city?: string;
      name?: string;
      country?: string;
    };
    return data.city || data.name || undefined;
  } catch {
    return undefined;
  }
}

export async function fetchWeatherByCoords(
  latitude: number,
  longitude: number,
  source: WeatherSnapshot["source"],
  locationLabel?: string,
): Promise<WeatherQueryResult | WeatherQueryFailure> {
  try {
    const params = new URLSearchParams({
      latitude: latitude.toFixed(4),
      longitude: longitude.toFixed(4),
      current: "temperature_2m,weather_code,precipitation,wind_speed_10m",
      daily: "temperature_2m_max,temperature_2m_min",
      forecast_days: "1",
      timezone: "auto",
    });
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
    if (!response.ok) {
      return { ok: false, reason: "error", message: "날씨 API 응답에 실패했습니다. 일정과 옷장은 그대로 사용할 수 있습니다." };
    }
    const data = (await response.json()) as {
      current?: {
        temperature_2m?: number;
        weather_code?: number;
        precipitation?: number;
        wind_speed_10m?: number;
        time?: string;
      };
      daily?: {
        temperature_2m_max?: number[];
        temperature_2m_min?: number[];
      };
    };
    const current = data.current;
    if (current?.temperature_2m == null) {
      return { ok: false, reason: "error", message: "기온 정보를 읽지 못했습니다." };
    }
    const label = locationLabel ?? (await reverseLabel(latitude, longitude));
    const max = data.daily?.temperature_2m_max?.[0];
    const min = data.daily?.temperature_2m_min?.[0];
    return {
      ok: true,
      snapshot: {
        temperatureCelsius: Math.round(current.temperature_2m),
        conditionCode: current.weather_code,
        locationLabel: label ?? (source === "geolocation" ? "현재 위치" : undefined),
        fetchedAt: current.time ? new Date(current.time).toISOString() : new Date().toISOString(),
        precipitationMm: current.precipitation,
        windSpeedKmh: current.wind_speed_10m,
        temperatureMaxCelsius: typeof max === "number" ? Math.round(max) : undefined,
        temperatureMinCelsius: typeof min === "number" ? Math.round(min) : undefined,
        source,
      },
    };
  } catch {
    return { ok: false, reason: "error", message: "날씨를 불러오지 못했습니다. 코디는 옷장과 TPO만으로 구성합니다." };
  }
}

export function requestBrowserLocation(timeout = 10000): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(Object.assign(new Error("unsupported"), { code: 0 }));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout,
      maximumAge: 300000,
    });
  });
}

export function geolocationFailure(error: unknown): WeatherQueryFailure {
  const code = typeof error === "object" && error && "code" in error ? Number((error as GeolocationPositionError).code) : NaN;
  if (code === 1) {
    return { ok: false, reason: "denied", message: "위치 권한이 없어 현재 지역 날씨를 쓰지 않습니다. 도시를 선택하거나 날씨 없이 계속할 수 있습니다." };
  }
  if (code === 3) {
    return { ok: false, reason: "timeout", message: "위치 확인이 지연되었습니다. 도시를 선택해 주세요." };
  }
  if (code === 0 || !("geolocation" in navigator)) {
    return { ok: false, reason: "unsupported", message: "이 브라우저는 위치 정보를 지원하지 않습니다. 도시를 선택해 주세요." };
  }
  return { ok: false, reason: "error", message: "위치를 확인하지 못했습니다. 도시를 선택하거나 날씨 없이 이용할 수 있습니다." };
}
