import { AGE_OPTIONS, STYLE_OPTIONS } from "../data/catalog";
import type { AgeGroup, StyleMood, UserPreferences } from "../data/types";
import { CategoryAccordion } from "./CategoryAccordion";
import { ColorChipGroup } from "./ColorChipGroup";

interface Props {
  value: UserPreferences;
  onChange: (next: UserPreferences) => void;
  showPalette?: boolean;
}

function toggle(list: StyleMood[], item: StyleMood): StyleMood[] {
  return list.includes(item) ? list.filter((entry) => entry !== item) : [...list, item];
}

function MoodChipGrid({
  options,
  selected,
  onToggle,
  labelledBy,
  avoid,
}: {
  options: typeof STYLE_OPTIONS;
  selected: StyleMood[];
  onToggle: (id: StyleMood) => void;
  labelledBy: string;
  avoid?: boolean;
}) {
  return (
    <div className="mood-chip-grid" role="group" aria-labelledby={labelledBy}>
      {options.map((option) => {
        const pressed = selected.includes(option.id);
        const name = option.chipLabel ?? option.label;
        const detail = `${option.english} · ${option.hint}`;
        return (
          <button
            key={option.id}
            type="button"
            className="mood-chip"
            aria-pressed={pressed}
            aria-label={`${avoid ? `${name} 피하기` : name}. ${option.hint}${pressed ? ", 선택됨" : ""}`}
            data-hint={detail}
            onClick={() => onToggle(option.id)}
          >
            <span className="mood-chip-label">{name}</span>
            {pressed ? (
              <span className="mood-chip-check" aria-hidden="true">
                ✓
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function StylePreferenceSelector({ value, onChange, showPalette = true }: Props) {
  return (
    <div className="stack">
      <CategoryAccordion
        title="선호 스타일·분위기"
        labelledBy="select-mood-title"
        meta={
          value.stylePreferences.length ? (
            <span className="filter-count" aria-label={`${value.stylePreferences.length}개 선택됨`}>
              {value.stylePreferences.length}
            </span>
          ) : null
        }
      >
        <p className="section-kicker">SELECT MOOD</p>
        <p className="helper">오늘의 옷차림에 가까운 무드를 하나 이상 선택해 주세요.</p>
        <MoodChipGrid
          options={STYLE_OPTIONS}
          selected={value.stylePreferences}
          labelledBy="select-mood-title"
          onToggle={(id) =>
            onChange({
              ...value,
              stylePreferences: toggle(value.stylePreferences, id),
              avoidStyles: value.avoidStyles.filter((entry) => entry !== id),
            })
          }
        />
      </CategoryAccordion>
      <CategoryAccordion
        title="피하고 싶은 스타일"
        labelledBy="avoid-mood-title"
        meta={
          value.avoidStyles.length ? (
            <span className="filter-count" aria-label={`${value.avoidStyles.length}개 선택됨`}>
              {value.avoidStyles.length}
            </span>
          ) : null
        }
      >
        <p className="section-kicker">AVOID MOOD</p>
        <p className="helper">같은 무드 목록에서 덜 입고 싶은 방향을 표시할 수 있습니다.</p>
        <MoodChipGrid
          options={STYLE_OPTIONS}
          selected={value.avoidStyles}
          labelledBy="avoid-mood-title"
          avoid
          onToggle={(id) =>
            onChange({
              ...value,
              avoidStyles: toggle(value.avoidStyles, id),
              stylePreferences: value.stylePreferences.filter((entry) => entry !== id),
            })
          }
        />
      </CategoryAccordion>
      {showPalette ? (
        <CategoryAccordion
          title="컬러 팔레트"
          labelledBy="preference-palette-title"
          meta={
            value.preferredColors.length ? (
              <span className="filter-count" aria-label={`${value.preferredColors.length}개 선택됨`}>
                {value.preferredColors.length}
              </span>
            ) : null
          }
        >
          <ColorChipGroup
            legend="SELECT PALETTE"
            description="오늘의 무드에 맞는 컬러 팔레트를 선택하세요."
            labelledBy="preference-palette-legend"
            selected={value.preferredColors}
            onToggle={(color) =>
              onChange({
                ...value,
                preferredColors: value.preferredColors.includes(color)
                  ? value.preferredColors.filter((entry) => entry !== color)
                  : [...value.preferredColors, color],
              })
            }
          />
        </CategoryAccordion>
      ) : null}
      <section className="card">
        <label className="field">
          <span>연령대 (보조 정보, 선택)</span>
          <select
            value={value.ageGroup}
            onChange={(event) => onChange({ ...value, ageGroup: event.target.value as AgeGroup })}
          >
            <option value="">입력하지 않음</option>
            {AGE_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <p className="helper">연령만으로 스타일을 단정하지 않습니다.</p>
      </section>
    </div>
  );
}
