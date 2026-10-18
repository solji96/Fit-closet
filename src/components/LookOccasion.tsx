import { useEffect, useRef, useState } from "react";
import { useStore } from "../data/store";
import type { CalendarEvent, TpoType, WeatherSnapshot } from "../data/types";
import {
  MANUAL_CITIES,
  conditionPhrase,
  fetchWeatherByCoords,
  geolocationFailure,
  requestBrowserLocation,
  weatherBand,
  type WeatherBand,
} from "../data/weather";
import { TPO_OPTIONS } from "../domain/tpo";

const WEATHER_MOODS: { id: WeatherBand; label: string; temperature: number }[] = [
  { id: "cold", label: "쌀쌀한 날", temperature: 8 },
  { id: "mild", label: "선선한 날", temperature: 17 },
  { id: "warm", label: "따뜻한 날", temperature: 26 },
];

function moodSnapshot(label: string, temperature: number): WeatherSnapshot {
  return {
    temperatureCelsius: temperature,
    locationLabel: label,
    fetchedAt: new Date().toISOString(),
    source: "manual",
  };
}

const DEFAULT_CITY = MANUAL_CITIES[0];

export function LookOccasion({ event }: { event: CalendarEvent | null }) {
  const { state, dispatch } = useStore();
  const [busy, setBusy] = useState(true);
  const [city, setCity] = useState(
    MANUAL_CITIES.find((entry) => entry.label === state.weather?.locationLabel)?.id ?? DEFAULT_CITY.id,
  );
  const weatherTouched = useRef(false);
  const band = state.weather ? weatherBand(state.weather.temperatureCelsius) : null;

  const markWeatherTouched = () => {
    weatherTouched.current = true;
  };

  useEffect(() => {
    let cancel = false;
    const publish = (snapshot: WeatherSnapshot) => {
      const match = MANUAL_CITIES.find((entry) => entry.label === snapshot.locationLabel);
      if (match) setCity(match.id);
      dispatch({ type: "refresh_weather", weather: snapshot });
    };

    const run = async () => {
      setBusy(true);
      try {
        const position = await requestBrowserLocation(4000);
        if (cancel || weatherTouched.current) return;
        const located = await fetchWeatherByCoords(position.coords.latitude, position.coords.longitude, "geolocation");
        if (cancel || weatherTouched.current) return;
        if (located.ok) {
          publish(located.snapshot);
          return;
        }
      } catch {
        // 위치를 쓸 수 없으면 기본 도시 날씨로 맞춘다.
      }
      if (cancel || weatherTouched.current) return;
      const fallback = await fetchWeatherByCoords(
        DEFAULT_CITY.latitude,
        DEFAULT_CITY.longitude,
        "manual",
        DEFAULT_CITY.label,
      );
      if (cancel || weatherTouched.current) return;
      if (!fallback.ok) {
        dispatch({
          type: "set_weather",
          weather: null,
          weatherStatus: "error",
          weatherMessage: fallback.message,
        });
        return;
      }
      publish(fallback.snapshot);
    };

    void run().finally(() => {
      if (!cancel) setBusy(false);
    });
    return () => {
      cancel = true;
    };
  }, [dispatch]);

  const apply = (patch: {
    tpo?: TpoType;
    weather?: WeatherSnapshot | null;
    weatherStatus?: "idle" | "ready" | "denied" | "unsupported" | "error";
    weatherMessage?: string | null;
  }) => {
    dispatch({ type: "set_look_context", eventId: event?.id, ...patch });
  };

  const loadByCoords = async (
    latitude: number,
    longitude: number,
    source: WeatherSnapshot["source"],
    locationLabel?: string,
  ) => {
    setBusy(true);
    const result = await fetchWeatherByCoords(latitude, longitude, source, locationLabel);
    setBusy(false);
    if (!result.ok) {
      if (event) {
        apply({ weather: null, weatherStatus: "error", weatherMessage: result.message });
      } else {
        dispatch({
          type: "set_weather",
          weather: null,
          weatherStatus: "error",
          weatherMessage: result.message,
        });
      }
      return;
    }
    apply({
      weather: result.snapshot,
      weatherStatus: "ready",
      weatherMessage: null,
    });
  };

  const loadCity = (nextCity: string) => {
    const selected = MANUAL_CITIES.find((entry) => entry.id === nextCity);
    if (!selected) return;
    void loadByCoords(selected.latitude, selected.longitude, "manual", selected.label);
  };

  const requestLocation = async () => {
    setBusy(true);
    try {
      const position = await requestBrowserLocation();
      await loadByCoords(position.coords.latitude, position.coords.longitude, "geolocation");
    } catch (error) {
      setBusy(false);
      const failure = geolocationFailure(error);
      const weatherStatus = failure.reason === "denied" || failure.reason === "unsupported" ? failure.reason : "error";
      if (event) {
        apply({ weather: null, weatherStatus, weatherMessage: failure.message });
      } else {
        dispatch({
          type: "set_weather",
          weather: null,
          weatherStatus,
          weatherMessage: failure.message,
        });
      }
    }
  };

  return (
    <section className="look-occasion" aria-label="오늘의 날씨와 상황">
      <div>
        <p className="brand-kicker">Today</p>
        <h1 className="look-occasion-title">오늘의 날씨와 상황</h1>
        <p className="lede">바깥 날씨를 먼저 맞춰 두었어요. 상황을 고르거나, 날씨가 다르면 아래에서 바꿀 수 있어요.</p>
      </div>

      <div className="look-occasion-group">
        <p className="look-occasion-label" id="look-weather-label">
          날씨
        </p>
        <div className="look-occasion-chips" role="group" aria-labelledby="look-weather-label">
          {WEATHER_MOODS.map((mood) => (
            <button
              key={mood.id}
              type="button"
              className="chip"
              aria-pressed={band === mood.id}
              onClick={() => {
                markWeatherTouched();
                apply({
                  weather: moodSnapshot(mood.label, mood.temperature),
                  weatherStatus: "ready",
                  weatherMessage: null,
                });
              }}
            >
              {mood.label}
            </button>
          ))}
        </div>
        <div className="look-occasion-city">
          <label>
            <span>도시</span>
            <select
              value={city}
              aria-label="날씨를 볼 도시"
              disabled={busy}
              onChange={(change) => {
                markWeatherTouched();
                const next = change.target.value;
                setCity(next);
                loadCity(next);
              }}
            >
              {MANUAL_CITIES.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.label}
                </option>
              ))}
            </select>
          </label>
          <button
            className="weather-bar-link"
            type="button"
            onClick={() => {
              markWeatherTouched();
              void requestLocation();
            }}
            disabled={busy}
          >
            현재 위치
          </button>
        </div>
        {busy ? (
          <p className="look-occasion-live" role="status">
            지금 위치의 날씨를 확인하고 있어요.
          </p>
        ) : null}
        {!busy && state.weather ? (
          <p className="look-occasion-live">
            {state.weather.locationLabel ?? "선택한 지역"} · {state.weather.temperatureCelsius}°C ·{" "}
            {conditionPhrase(state.weather.conditionCode, state.weather.temperatureCelsius)}
          </p>
        ) : null}
        {!busy && state.weatherMessage ? <p className="helper">{state.weatherMessage}</p> : null}
      </div>

      <div className="look-occasion-group">
        <p className="look-occasion-label" id="look-tpo-label">
          상황
        </p>
        <div className="look-occasion-chips" role="group" aria-labelledby="look-tpo-label">
          {TPO_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className="chip"
              aria-pressed={event?.tpo === option.id}
              onClick={() => apply({ tpo: option.id })}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
