import { useState } from "react";
import { useStore } from "../data/store";
import {
  conditionPhrase,
  fetchWeatherByCoords,
  formatFetchedAt,
  geolocationFailure,
  MANUAL_CITIES,
  requestBrowserLocation,
} from "../data/weather";

interface Props {
  variant?: "full" | "summary" | "controls" | "bar";
  guide?: string;
}

export function WeatherWidget({ variant = "full", guide }: Props) {
  const { state, dispatch } = useStore();
  const [busy, setBusy] = useState(false);
  const [city, setCity] = useState(
    MANUAL_CITIES.find((entry) => entry.label === state.weather?.locationLabel)?.id ?? MANUAL_CITIES[0].id,
  );

  const applyFailure = (failure: ReturnType<typeof geolocationFailure>) => {
    dispatch({
      type: "set_weather",
      weather: null,
      weatherStatus: failure.reason === "denied" || failure.reason === "unsupported" ? failure.reason : "error",
      weatherMessage: failure.message,
    });
  };

  const loadByCoords = async (
    latitude: number,
    longitude: number,
    source: "geolocation" | "manual",
    locationLabel?: string,
  ) => {
    setBusy(true);
    const result = await fetchWeatherByCoords(latitude, longitude, source, locationLabel);
    setBusy(false);
    if (!result.ok) {
      dispatch({
        type: "set_weather",
        weather: null,
        weatherStatus: "error",
        weatherMessage: result.message,
      });
      return;
    }
    dispatch({
      type: "set_weather",
      weather: result.snapshot,
      weatherStatus: "ready",
      weatherMessage: null,
    });
  };

  const requestLocation = async () => {
    setBusy(true);
    try {
      const position = await requestBrowserLocation();
      await loadByCoords(position.coords.latitude, position.coords.longitude, "geolocation");
    } catch (error) {
      setBusy(false);
      applyFailure(geolocationFailure(error));
    }
  };

  const loadSelectedCity = (nextCity = city) => {
    const selected = MANUAL_CITIES.find((entry) => entry.id === nextCity);
    if (!selected) return;
    void loadByCoords(selected.latitude, selected.longitude, "manual", selected.label);
  };

  const snapshot = state.weather;
  const phrase = snapshot
    ? `${conditionPhrase(snapshot.conditionCode, snapshot.temperatureCelsius)} · ${snapshot.temperatureCelsius}°C`
    : null;

  const controls = (
    <div className="weather-toolbar">
      <label className="field weather-city">
        <span>도시 변경</span>
        <select value={city} onChange={(event) => setCity(event.target.value)} aria-label="날씨를 볼 도시">
          {MANUAL_CITIES.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.label}
            </option>
          ))}
        </select>
      </label>
      <button className="btn" type="button" onClick={() => loadSelectedCity()} disabled={busy}>
        도시 날씨
      </button>
      <button className="btn btn-ghost" type="button" onClick={() => void requestLocation()} disabled={busy}>
        다시 확인
      </button>
    </div>
  );

  if (variant === "controls") return controls;

  if (variant === "bar") {
    const place = snapshot?.locationLabel ?? MANUAL_CITIES.find((entry) => entry.id === city)?.label ?? "선택한 지역";
    return (
      <section className="weather-guide" aria-label="현재 지역 날씨 및 코디 가이드">
        <div className="weather-guide-head">
          <strong>현재 지역 날씨 & 코디 가이드</strong>
          <select
            value={city}
            aria-label="날씨를 볼 도시"
            disabled={busy}
            onChange={(event) => {
              const next = event.target.value;
              setCity(next);
              loadSelectedCity(next);
            }}
          >
            {MANUAL_CITIES.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.label}
                {snapshot && entry.label === snapshot.locationLabel
                  ? ` (${snapshot.temperatureCelsius}°C · ${conditionPhrase(snapshot.conditionCode, snapshot.temperatureCelsius)})`
                  : ""}
              </option>
            ))}
          </select>
        </div>
        {busy ? <p className="helper" role="status">날씨를 확인하는 중</p> : null}
        {!snapshot && !busy && state.weatherMessage ? <p className="helper">{state.weatherMessage}</p> : null}
        <p className="weather-guide-copy">
          {snapshot ? <span className="weather-guide-kicker">[{place} 날씨 코디 추천]</span> : null}{" "}
          {guide ?? "도시를 고르면 기온에 맞춰 코디를 안내합니다."}
        </p>
        <p className="weather-caption">체형·재고는 반영하지 않았습니다. 좌표는 기기에 저장하지 않습니다.</p>
        <button className="weather-bar-link" type="button" onClick={() => void requestLocation()} disabled={busy}>
          현재 위치
        </button>
      </section>
    );
  }

  return (
    <section className="weather-widget" aria-label="날씨">
      <p className="section-kicker">WEATHER</p>
      {busy ? <p className="helper">날씨를 확인하는 중</p> : null}
      {snapshot && !busy ? (
        <>
          <p className="weather-line">{phrase}</p>
          <p className="muted">
            {snapshot.locationLabel ?? "선택한 지역"} · {formatFetchedAt(snapshot.fetchedAt)} 기준 · Open-Meteo
          </p>
        </>
      ) : null}
      {!snapshot && !busy ? (
        <>
          <p className="weather-line">현재 지역 날씨 확인</p>
          {state.weatherMessage ? <p className="helper">{state.weatherMessage}</p> : (
            <p className="helper">버튼을 누른 뒤에만 위치 권한을 요청합니다.</p>
          )}
          <button className="btn btn-primary" type="button" onClick={() => void requestLocation()}>
            현재 지역 날씨 보기
          </button>
        </>
      ) : null}
      <p className="weather-caption">체형·재고는 반영하지 않았습니다. 좌표는 기기에 저장하지 않습니다.</p>
      {variant === "full" ? controls : null}
    </section>
  );
}
