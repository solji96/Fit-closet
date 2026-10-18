import { PALETTE_SWATCHES } from "../data/catalog";

function isLightSwatch(name: string): boolean {
  return name === "화이트" || name === "오트밀" || name === "크림" || name.includes("아이보리");
}

interface Props {
  legend: string;
  description: string;
  selected: string[];
  onToggle: (color: string) => void;
  labelledBy: string;
  title?: string;
}

export function ColorChipGroup({
  legend,
  description,
  selected,
  onToggle,
  labelledBy,
  title = "컬러 팔레트",
}: Props) {
  const descriptionId = `${labelledBy}-copy`;

  return (
    <section className="palette-section" aria-labelledby={labelledBy}>
      <p className="section-kicker" id={labelledBy}>
        {legend}
      </p>
      <h2 className="sr-only">{title}</h2>
      <p className="helper palette-copy" id={descriptionId}>
        {description}
      </p>
      <div className="color-chip-grid" role="group" aria-labelledby={labelledBy} aria-describedby={descriptionId}>
        {PALETTE_SWATCHES.map((swatch) => {
          const pressed = selected.includes(swatch.name);
          return (
            <button
              key={swatch.name}
              type="button"
              className="color-chip"
              aria-pressed={pressed}
              aria-label={`${swatch.name}${pressed ? ", 선택됨" : ""}`}
              onClick={() => onToggle(swatch.name)}
            >
              <span
                className={`color-chip-swatch${isLightSwatch(swatch.name) ? " is-light" : ""}`}
                style={{ backgroundColor: swatch.hex }}
                aria-hidden="true"
              />
              <span className="color-chip-name">{swatch.name}</span>
              {pressed ? (
                <span className="color-chip-check" aria-hidden="true">
                  ✓
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
